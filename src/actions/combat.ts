'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { progressQuests } from '@/actions/quests';
import { maybePruneEventLog } from '@/lib/game/event-log';
import { getArmorDefense, getWeaponDamage } from '@/lib/game/items';
import {
  getEnemyByName,
  rollEnemyCredits,
  rollEnemyDrops,
} from '@/lib/game/enemies';
import {
  MAX_HEALTH_PER_LEVEL,
  baseAttackForLevel,
  baseDefenseForLevel,
} from '@/lib/game/progression';
import { computeVehicleBonuses } from '@/lib/game/vehicle';
import { randInt, chance } from '@/lib/game/random';
import {
  advanceTurns,
  awardXp,
  describeGrants,
  grantItems,
  logNarrative,
} from '@/lib/game/engine';

export type CombatAction = 'ATTACK' | 'DEFEND' | 'FLEE';

const HEAL_ON_WIN_PCT = 0.2;
const DEFEND_REDUCTION = 0.65; // fraction of incoming damage blocked
const DEFEND_RIPOSTE = 0.35; // fraction of your attack still landing
const CRIT_CHANCE = 0.15;
const CRIT_MULTIPLIER = 1.8;

export async function executeCombatTurn(action: CombatAction) {
  const session = await auth();
  if (!session?.user?.name) return { error: 'Unauthorized' };

  const player = await prisma.player.findUnique({
    where: { username: session.user.name },
    include: {
      activeEncounter: true,
      inventory: { where: { equipSlot: { not: null } } },
      vehicle: { include: { components: true } },
    },
  });

  if (!player) return { error: 'Player not found' };
  if (!player.isAlive || player.health <= 0) return { error: 'You are dead' };
  if (!player.activeEncounter) return { error: 'No active encounter' };

  const encounter = player.activeEncounter;
  const enemyDef = getEnemyByName(encounter.enemyName);

  // ---- Player offence / defence ----
  const weapon = player.inventory.find((i) => i.equipSlot === 'WEAPON');
  const weaponDamage = weapon
    ? getWeaponDamage(weapon.baseItemId, weapon.rarity)
    : 0;
  const armorDefense = player.inventory
    .filter((i) => i.equipSlot && i.equipSlot !== 'WEAPON')
    .reduce((sum, i) => sum + getArmorDefense(i.baseItemId, i.rarity), 0);
  const vehicleArmor = player.vehicle
    ? computeVehicleBonuses(player.vehicle.components).armorBonus
    : 0;

  const attackPower = baseAttackForLevel(player.level) + weaponDamage;
  const defense =
    baseDefenseForLevel(player.level) + armorDefense + vehicleArmor;
  const enemyArmor = enemyDef?.armor ?? 0;

  try {
    let enemyDead = false;
    let questTarget = '';

    await prisma.$transaction(async (tx) => {
      let playerDamage = 0;
      let enemyDamage = 0;
      let narrative = '';
      let encounterEnded = false;
      let wasCrit = false;

      const rawEnemyHit = Math.max(
        1,
        Math.round(encounter.enemyAttack - defense)
      );

      switch (action) {
        case 'ATTACK': {
          wasCrit = chance(CRIT_CHANCE);
          const swing = randInt(
            Math.round(attackPower * 0.85),
            Math.round(attackPower * 1.15)
          );
          playerDamage = Math.max(
            1,
            Math.round((wasCrit ? swing * CRIT_MULTIPLIER : swing) - enemyArmor)
          );
          enemyDamage = rawEnemyHit;
          narrative = wasCrit
            ? `CRITICAL — you find the gap and put ${playerDamage} into the ${encounter.enemyName}. It answers for ${enemyDamage}.`
            : `You hit the ${encounter.enemyName} for ${playerDamage}. It counters for ${enemyDamage}.`;
          break;
        }

        case 'DEFEND': {
          // Defending used to deal zero damage and often zero out the enemy's
          // hit entirely, making it a pure stall. It now trades tempo: you
          // block most of the hit and still land a partial blow.
          playerDamage = Math.max(
            1,
            Math.round(attackPower * DEFEND_RIPOSTE - enemyArmor)
          );
          enemyDamage = Math.max(
            0,
            Math.round(rawEnemyHit * (1 - DEFEND_REDUCTION))
          );
          narrative = `You brace behind your guard, taking only ${enemyDamage}, and shove back for ${playerDamage}.`;
          break;
        }

        case 'FLEE': {
          // Fleeing is likelier when you are hurt — the game should let a
          // losing fight end rather than grind the player into a death spiral.
          const desperation = 1 - player.health / player.maxHealth;
          const success = chance(0.5 + desperation * 0.35);
          if (success) {
            narrative = `You throw the van into reverse and leave the ${encounter.enemyName} shouting in the dust.`;
            encounterEnded = true;
          } else {
            enemyDamage = Math.round(rawEnemyHit * 1.2);
            narrative = `You break too slow. The ${encounter.enemyName} catches your exposed back for ${enemyDamage}.`;
          }
          break;
        }
      }

      const newEnemyHp = Math.max(0, encounter.enemyHp - playerDamage);
      let newPlayerHp = Math.max(0, Math.floor(player.health - enemyDamage));
      const playerDied = newPlayerHp <= 0;
      let bounty = 0;

      if (newEnemyHp <= 0 && !playerDied && action !== 'FLEE') {
        bounty = enemyDef ? rollEnemyCredits(enemyDef) : randInt(20, 40);
        const healAmount = Math.floor(player.maxHealth * HEAL_ON_WIN_PCT);
        newPlayerHp = Math.min(player.maxHealth, newPlayerHp + healAmount);

        const drops = enemyDef ? rollEnemyDrops(enemyDef) : [];
        if (drops.length > 0) {
          await grantItems(tx, player.id, drops);
        }

        narrative += ` The ${encounter.enemyName} goes down. You strip ${bounty} EC${
          drops.length > 0 ? ` and ${describeGrants(drops)}` : ''
        } from the wreck, and patch ${healAmount} HP in the quiet after.`;

        encounterEnded = true;
        enemyDead = true;
        questTarget = encounter.enemyName;

        for (const drop of drops) {
          await progressQuests(
            player.id,
            'GATHER',
            drop.baseItemId,
            drop.quantity
          );
        }
      }

      if (playerDied) {
        narrative +=
          ' The blow lands somewhere it should not. The road goes white, then nothing.';
        encounterEnded = true;
      }

      // Compare-and-swap on the health we read, so a double-submit cannot
      // overwrite a turn it never saw.
      const updated = await tx.player.updateMany({
        where: { id: player.id, health: player.health, isAlive: true },
        data: {
          health: newPlayerHp,
          isAlive: !playerDied,
          ...(bounty > 0 && { credits: { increment: bounty } }),
        },
      });
      if (updated.count === 0) throw new Error('Action conflict, please retry');

      await tx.eventLog.create({
        data: {
          playerId: player.id,
          eventType: 'COMBAT_TURN',
          payload: {
            action,
            playerDamage,
            enemyDamage,
            newEnemyHp,
            newPlayerHp,
            crit: wasCrit,
          },
        },
      });

      await logNarrative(
        tx,
        player.id,
        narrative,
        playerDied ? 'PLAYER_DIED' : 'COMBAT_TURN_TEXT'
      );

      // A level-up patches the player back to a new, higher max HP, so the
      // survival tick below has to work from that value rather than the HP
      // they finished the swing on.
      let healthAfterXp = newPlayerHp;
      if (enemyDead && enemyDef) {
        const xp = await awardXp(tx, player, enemyDef.xp);
        if (xp.narrative) {
          await logNarrative(tx, player.id, xp.narrative, 'LEVEL_UP');
          healthAfterXp =
            player.maxHealth +
            (xp.newLevel - player.level) * MAX_HEALTH_PER_LEVEL;
        }
      }

      if (encounterEnded) {
        const deleted = await tx.activeEncounter.deleteMany({
          where: { id: encounter.id, enemyHp: encounter.enemyHp },
        });
        if (deleted.count === 0)
          throw new Error('Action conflict, please retry');
      } else {
        const advanced = await tx.activeEncounter.updateMany({
          where: { id: encounter.id, enemyHp: encounter.enemyHp },
          data: { enemyHp: newEnemyHp },
        });
        if (advanced.count === 0)
          throw new Error('Action conflict, please retry');
      }

      if (!playerDied) {
        await advanceTurns(tx, { ...player, health: healthAfterXp }, 1);
      }

      await maybePruneEventLog(tx, player.id);
    });

    if (enemyDead && questTarget) {
      await progressQuests(player.id, 'KILL', questTarget, 1);
    }

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Execute combat turn failed:', error);
    return {
      error:
        error instanceof Error
          ? error.message
          : 'Failed to execute combat turn',
    };
  }
}
