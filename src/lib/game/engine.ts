// Shared transaction helpers used by every server action: granting loot,
// awarding XP, advancing the world clock, and applying survival drain.
// Actions used to hand-roll all of this, which is why XP was never awarded
// anywhere and hunger/thirst never moved.

import { Prisma, Player, RarityTier } from '@prisma/client';
import { ITEMS } from './items';
import { applyLevelUps } from './progression';
import {
  clockFromTurns,
  starvationDamage,
  survivalDrainForTurns,
  survivalWarnings,
  weatherFromTurns,
} from './world';

export const MAX_STAT = 100;

export async function logNarrative(
  tx: Prisma.TransactionClient,
  playerId: string,
  text: string,
  eventType = 'SYSTEM_NARRATIVE'
) {
  await tx.eventLog.create({
    data: { playerId, eventType, payload: { text } },
  });
}

// ------------------------------------------------------
// Loot
// ------------------------------------------------------

export interface ItemGrant {
  baseItemId: string;
  quantity: number;
  rarity?: RarityTier;
}

/** Adds items, stacking onto an existing unequipped stack of the same
 * base item and rarity. Gear always lands as its own instance. */
export async function grantItems(
  tx: Prisma.TransactionClient,
  playerId: string,
  grants: ItemGrant[]
): Promise<void> {
  for (const grant of grants) {
    if (grant.quantity <= 0) continue;
    const rarity = grant.rarity ?? 'COMMON';
    const def = ITEMS[grant.baseItemId];
    const isGear = def?.category === 'WEAPON' || def?.category === 'ARMOR';

    if (!isGear) {
      const existing = await tx.playerInventory.findFirst({
        where: {
          playerId,
          baseItemId: grant.baseItemId,
          rarity,
          equipSlot: null,
        },
      });

      if (existing) {
        await tx.playerInventory.update({
          where: { instanceId: existing.instanceId },
          data: { quantity: { increment: grant.quantity } },
        });
        continue;
      }
    }

    await tx.playerInventory.create({
      data: {
        playerId,
        baseItemId: grant.baseItemId,
        rarity,
        quantity: isGear ? 1 : grant.quantity,
      },
    });
  }
}

export function describeGrants(grants: ItemGrant[]): string {
  return grants
    .map((g) => {
      const rarityLabel =
        g.rarity && g.rarity !== 'COMMON' ? `${g.rarity} ` : '';
      return `${g.quantity}x ${rarityLabel}${g.baseItemId}`;
    })
    .join(', ');
}

// ------------------------------------------------------
// XP and levelling
// ------------------------------------------------------

export interface XpOutcome {
  xpGained: number;
  leveledUp: boolean;
  newLevel: number;
  narrative: string | null;
}

/** Awards XP and applies any level-ups (max HP, skill points, EC, full heal). */
export async function awardXp(
  tx: Prisma.TransactionClient,
  player: Pick<Player, 'id' | 'level' | 'xp' | 'maxHealth'>,
  amount: number
): Promise<XpOutcome> {
  if (amount <= 0) {
    return {
      xpGained: 0,
      leveledUp: false,
      newLevel: player.level,
      narrative: null,
    };
  }

  const totalXp = player.xp + amount;
  const levelUp = applyLevelUps(player.level, totalXp);

  if (!levelUp) {
    await tx.player.update({
      where: { id: player.id },
      data: { xp: totalXp },
    });
    return {
      xpGained: amount,
      leveledUp: false,
      newLevel: player.level,
      narrative: null,
    };
  }

  const newMaxHealth = player.maxHealth + levelUp.maxHealthGained;
  await tx.player.update({
    where: { id: player.id },
    data: {
      xp: totalXp,
      level: levelUp.newLevel,
      maxHealth: newMaxHealth,
      health: newMaxHealth, // levelling up patches you all the way back up
      skillPoints: { increment: levelUp.skillPointsGained },
      credits: { increment: levelUp.creditsGained },
    },
  });

  return {
    xpGained: amount,
    leveledUp: true,
    newLevel: levelUp.newLevel,
    narrative: `LEVEL ${levelUp.newLevel}. The road has taught you something it charges most people their lives for. +${levelUp.maxHealthGained} max HP, +${levelUp.skillPointsGained} skill point(s), +${levelUp.creditsGained} EC, and you are patched back to full.`,
  };
}

// ------------------------------------------------------
// World clock + survival
// ------------------------------------------------------

export interface TurnOutcome {
  warnings: string[];
  starvationDamage: number;
  died: boolean;
}

type SurvivalPlayer = Pick<
  Player,
  'id' | 'turns' | 'hunger' | 'thirst' | 'fatigue' | 'sanity' | 'health'
>;

/**
 * Advances the world clock by `turns` and applies survival drain. Returns any
 * warnings to surface and whether the drain proved fatal.
 */
export async function advanceTurns(
  tx: Prisma.TransactionClient,
  player: SurvivalPlayer,
  turns: number
): Promise<TurnOutcome> {
  const weather = weatherFromTurns(player.turns);
  const isNight = clockFromTurns(player.turns).isNight;
  const drain = survivalDrainForTurns(turns, weather, isNight);

  const hunger = clamp(player.hunger + drain.hunger);
  const thirst = clamp(player.thirst + drain.thirst);
  const fatigue = clamp(player.fatigue + drain.fatigue);
  const sanity = clamp(player.sanity + drain.sanity);

  const damage = starvationDamage(hunger, thirst, fatigue) * turns;
  const health = Math.max(0, player.health - damage);
  const died = health <= 0;

  await tx.player.update({
    where: { id: player.id },
    data: {
      turns: { increment: turns },
      hunger,
      thirst,
      fatigue,
      sanity,
      ...(damage > 0 && { health, isAlive: !died }),
    },
  });

  return {
    warnings: survivalWarnings(hunger, thirst, fatigue, sanity),
    starvationDamage: damage,
    died,
  };
}

export function clamp(value: number, min = 0, max = MAX_STAT): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}
