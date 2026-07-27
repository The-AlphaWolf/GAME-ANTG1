'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { PlayerInventory, Prisma } from '@prisma/client';
import { grantStarterChest } from '@/lib/game/starter-chest';
import { parseIntent } from '@/lib/game/intent-parser';
import { maybePruneEventLog } from '@/lib/game/event-log';
import {
  ITEMS,
  ItemCategory,
  getEquipSlot,
  getWeaponDamage,
} from '@/lib/game/items';
import { createStarterVehicle } from '@/lib/game/vehicle';
import { chapterForMiles } from '@/lib/game/story';
import { npcsForChapter } from '@/lib/game/npcs';
import { pickOne, randInt } from '@/lib/game/random';
import { clockFromTurns, weatherFromTurns } from '@/lib/game/world';
import {
  MAX_STAT,
  advanceTurns,
  awardXp,
  clamp,
  logNarrative,
} from '@/lib/game/engine';

const MAX_ARMOR = 100;
const MAX_FUEL = 100;
const ACTION_XP = 3;

export async function submitAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.email) return { error: 'Unauthorized' };

  const actionText = (formData.get('actionText') as string)?.trim();
  if (!actionText) return { error: 'Action text is required' };

  const player = await prisma.player.findUnique({
    where: { username: session.user.name || '' },
    include: { vehicle: true, inventory: true },
  });

  if (!player) return { error: 'Player not found' };
  if (!player.isAlive || player.health <= 0) return { error: 'You are dead' };

  const intent = parseIntent(actionText);
  const chapter = chapterForMiles(player.distanceTraveled);

  try {
    await prisma.$transaction(async (tx) => {
      await tx.eventLog.create({
        data: {
          playerId: player.id,
          eventType: 'PLAYER_ACTION',
          payload: { action: actionText },
        },
      });

      let narrative: string;
      let turnsSpent = 1;

      switch (intent.type) {
        case 'REST': {
          if (player.hunger >= 80 || player.thirst >= 80) {
            throw new Error(
              'Too hungry or thirsty to sleep. Eat or drink first.'
            );
          }
          turnsSpent = 2;
          const energyGain = Math.min(45, MAX_STAT - player.energy);
          await tx.player.update({
            where: { id: player.id },
            data: {
              energy: clamp(player.energy + energyGain),
              fatigue: clamp(player.fatigue - 55),
              sanity: clamp(player.sanity + 12),
              health: Math.min(player.maxHealth, player.health + 10),
            },
          });
          narrative =
            'You pull off the road, kill the engine, and sleep for a few hours with the doors locked. Energy back, the ache in your shoulders gone, the hunger closer.';
          break;
        }

        case 'EAT': {
          const food = bestConsumable(player.inventory, 'FOOD');
          if (!food) throw new Error('No food in the van.');
          const effects = ITEMS[food.baseItemId].effects!;
          await consume(tx, food);
          await tx.player.update({
            where: { id: player.id },
            data: {
              hunger: clamp(player.hunger - (effects.hunger ?? 0)),
              energy: clamp(player.energy + (effects.energy ?? 0)),
              sanity: clamp(player.sanity + (effects.sanity ?? 0)),
            },
          });
          narrative = `You eat ${food.baseItemId}. The edge comes off the hunger.`;
          break;
        }

        case 'DRINK': {
          const water = bestConsumable(player.inventory, 'WATER');
          if (!water) throw new Error('No water in the van.');
          const effects = ITEMS[water.baseItemId].effects!;
          await consume(tx, water);
          await tx.player.update({
            where: { id: player.id },
            data: {
              thirst: clamp(player.thirst - (effects.thirst ?? 0)),
              health: Math.min(
                player.maxHealth,
                Math.max(0, player.health + (effects.health ?? 0))
              ),
            },
          });
          narrative =
            water.baseItemId === 'Dirty Water'
              ? 'You drink the silty runoff. It helps. Your stomach files a formal complaint.'
              : 'You drink Clean Water and feel almost human.';
          break;
        }

        case 'HEAL': {
          if (player.health >= player.maxHealth)
            throw new Error('Already at full health');
          const kit = bestConsumable(player.inventory, 'MEDICAL');
          if (!kit) throw new Error('Nothing to treat yourself with.');
          const effects = ITEMS[kit.baseItemId].effects!;
          await consume(tx, kit);
          await tx.player.update({
            where: { id: player.id },
            data: {
              health: Math.min(
                player.maxHealth,
                player.health + (effects.health ?? 0)
              ),
              energy: clamp(player.energy + (effects.energy ?? 0)),
              fatigue: clamp(player.fatigue - (effects.fatigue ?? 0)),
              sanity: clamp(player.sanity + (effects.sanity ?? 0)),
            },
          });
          narrative = `You work on yourself with a ${kit.baseItemId}. It holds.`;
          break;
        }

        case 'REFUEL': {
          if (!player.vehicle) throw new Error('You have no vehicle');
          if (player.vehicle.fuel >= MAX_FUEL)
            throw new Error('Tank is already full');
          const canister = player.inventory.find(
            (i) => i.baseItemId === 'Fuel Canister' && i.quantity > 0
          );
          if (!canister) throw new Error('No Fuel Canister to pour.');
          await consume(tx, canister);
          const gain = Math.min(
            ITEMS['Fuel Canister'].effects!.fuel ?? 40,
            MAX_FUEL - player.vehicle.fuel
          );
          await tx.vehicle.update({
            where: { id: player.vehicle.id },
            data: { fuel: { increment: gain } },
          });
          narrative = `You empty a canister into the tank. +${gain} fuel.`;
          break;
        }

        case 'REPAIR': {
          if (!player.vehicle) throw new Error('You have no vehicle to repair');
          if (player.vehicle.armor >= MAX_ARMOR)
            throw new Error('The van is already in good shape');

          const kit = player.inventory.find(
            (i) => i.baseItemId === 'Repair Kit' && i.quantity > 0
          );
          const scrap = player.inventory.find(
            (i) => i.baseItemId === 'Scrap Metal' && i.quantity >= 3
          );

          let gain: number;
          if (kit) {
            await consume(tx, kit);
            gain = ITEMS['Repair Kit'].effects!.armor ?? 35;
          } else if (scrap) {
            const used = await tx.playerInventory.updateMany({
              where: { instanceId: scrap.instanceId, quantity: { gte: 3 } },
              data: { quantity: { decrement: 3 } },
            });
            if (used.count === 0) throw new Error('Need 3 Scrap Metal');
            gain = 18;
          } else {
            throw new Error('Need a Repair Kit or 3 Scrap Metal to patch up');
          }

          const applied = Math.min(gain, MAX_ARMOR - player.vehicle.armor);
          await tx.vehicle.update({
            where: { id: player.vehicle.id },
            data: { armor: { increment: applied } },
          });
          narrative = `You weld plate over the worst of it. +${applied} vehicle armor.`;
          break;
        }

        case 'EQUIP': {
          const best = bestUpgrade(player.inventory);
          if (!best) throw new Error('Nothing better to equip right now.');
          await tx.playerInventory.updateMany({
            where: { playerId: player.id, equipSlot: best.slot },
            data: { equipSlot: null },
          });
          await tx.playerInventory.update({
            where: { instanceId: best.item.instanceId },
            data: { equipSlot: best.slot },
          });
          narrative = `You strap on the ${best.item.rarity} ${best.item.baseItemId}. Better.`;
          turnsSpent = 0;
          break;
        }

        case 'INSPECT': {
          const clock = clockFromTurns(player.turns);
          const weather = weatherFromTurns(player.turns);
          narrative = `Day ${clock.day}, ${clock.label}, ${weather.label.toLowerCase()}. ${chapter.zone}, mile ${player.distanceTraveled}. ${player.health}/${player.maxHealth} HP, ${player.energy} energy, ${player.credits} EC, ${player.vehicle?.fuel ?? 0}% fuel. ${chapter.objective}`;
          turnsSpent = 0;
          break;
        }

        case 'TALK': {
          const cast = npcsForChapter(chapter.number);
          const named = cast.find((npc) =>
            npc.keywords.some((k) => intent.raw.toLowerCase().includes(k))
          );
          const npc =
            named ?? pickOne(cast.filter((n) => n.role !== 'ANTAGONIST'));
          const line = pickOne(npc.replies).replaceAll(
            '{player}',
            player.username
          );
          narrative = `You key the radio. ${npc.handle} answers on the second try. "${line}"`;
          await tx.npcRelation.upsert({
            where: {
              playerId_npcId: { playerId: player.id, npcId: npc.id },
            },
            create: {
              playerId: player.id,
              npcId: npc.id,
              affinity: 1,
              metCount: 1,
            },
            update: { affinity: { increment: 1 } },
          });
          turnsSpent = 0;
          break;
        }

        case 'UNKNOWN':
        default: {
          narrative = improviseOutcome(actionText, chapter.zone);
          turnsSpent = 0;
          break;
        }
      }

      await logNarrative(tx, player.id, narrative);

      const xp = await awardXp(tx, player, ACTION_XP);
      if (xp.narrative)
        await logNarrative(tx, player.id, xp.narrative, 'LEVEL_UP');

      if (turnsSpent > 0) {
        const turn = await advanceTurns(tx, player, turnsSpent);
        for (const warning of turn.warnings) {
          await logNarrative(tx, player.id, warning, 'SURVIVAL_WARNING');
        }
      }

      await maybePruneEventLog(tx, player.id);
    });
  } catch (error) {
    console.error('Failed to process action:', error);
    return {
      error:
        error instanceof Error ? error.message : 'Failed to process action',
    };
  }

  revalidatePath('/');
  return { success: true };
}

// ------------------------------------------------------
// Helpers
// ------------------------------------------------------

/** Highest-value consumable of a category, so "eat" always picks sensibly. */
function bestConsumable(
  inventory: PlayerInventory[],
  category: ItemCategory
): PlayerInventory | undefined {
  return inventory
    .filter((i) => {
      const def = ITEMS[i.baseItemId];
      return def?.category === category && def.effects && i.quantity > 0;
    })
    .sort((a, b) => ITEMS[a.baseItemId].value - ITEMS[b.baseItemId].value)[0];
}

async function consume(
  tx: Prisma.TransactionClient,
  item: PlayerInventory
): Promise<void> {
  if (item.quantity > 1) {
    await tx.playerInventory.update({
      where: { instanceId: item.instanceId },
      data: { quantity: { decrement: 1 } },
    });
  } else {
    await tx.playerInventory.delete({ where: { instanceId: item.instanceId } });
  }
}

/** Finds the single best unequipped weapon upgrade the player is carrying. */
function bestUpgrade(inventory: PlayerInventory[]) {
  const equipped = inventory.find((i) => i.equipSlot === 'WEAPON');
  const equippedDamage = equipped
    ? getWeaponDamage(equipped.baseItemId, equipped.rarity)
    : 0;

  const candidates = inventory
    .filter((i) => !i.equipSlot && getEquipSlot(i.baseItemId) === 'WEAPON')
    .map((item) => ({
      item,
      slot: 'WEAPON' as const,
      damage: getWeaponDamage(item.baseItemId, item.rarity),
    }))
    .filter((c) => c.damage > equippedDamage)
    .sort((a, b) => b.damage - a.damage);

  return candidates[0];
}

/** Free-text fallback. Something small always happens so typing is never a
 * dead end the way "It echoes into the void" was. */
function improviseOutcome(actionText: string, zone: string): string {
  const flavours = [
    `You try to ${actionText.toLowerCase()}. ${zone} does not object, which out here counts as encouragement.`,
    `You spend a few minutes on it. Nothing changes except the light.`,
    `A half-burnt journal page blows against the windscreen while you work. Someone else made it this far too.`,
    `Somewhere behind you an engine turns over, runs for ten seconds, and stops. You do not go back to look.`,
    `You catch your reflection in the wing mirror and barely recognise the person driving.`,
  ];
  return pickOne(flavours) + (randInt(1, 4) === 1 ? ' Worth remembering.' : '');
}

// ------------------------------------------------------
// Run lifecycle
// ------------------------------------------------------

export async function restartGame() {
  const session = await auth();
  if (!session?.user?.email) return { error: 'Unauthorized' };

  const player = await prisma.player.findUnique({
    where: { username: session.user.name || '' },
  });
  if (!player) return { error: 'Player not found' };

  try {
    await prisma.$transaction(async (tx) => {
      await tx.activeEncounter.deleteMany({ where: { playerId: player.id } });
      await tx.playerInventory.deleteMany({ where: { playerId: player.id } });
      await tx.activeQuest.deleteMany({ where: { playerId: player.id } });
      await tx.eventLog.deleteMany({ where: { playerId: player.id } });
      await tx.npcRelation.deleteMany({ where: { playerId: player.id } });
      await tx.vehicle.deleteMany({ where: { playerId: player.id } });

      await tx.player.update({
        where: { id: player.id },
        data: {
          level: 1,
          xp: 0,
          health: 100,
          maxHealth: 100,
          energy: 100,
          hunger: 0,
          sanity: 100,
          fatigue: 0,
          thirst: 0,
          isAlive: true,
          distanceTraveled: 0,
          credits: 0,
          turns: 0,
          chapter: 1,
          reputation: 0,
          skillPoints: 0,
          upgradeCharges: 6,
          lastUpgradeReset: new Date(),
        },
      });

      await createStarterVehicle(tx, player.id);

      await logNarrative(
        tx,
        player.id,
        'A new run. Highway 17 runs east out of nothing and keeps going. Your van is loaded, the tank is full, and the evac port at Vantage is a thousand miles of bad road away.'
      );

      await grantStarterChest(tx, player.id);
    });
  } catch (error) {
    console.error('Failed to restart game:', error);
    return { error: 'Failed to restart game' };
  }

  revalidatePath('/');
  return { success: true };
}

export async function respawn() {
  const session = await auth();
  if (!session?.user?.email) return { error: 'Unauthorized' };

  const player = await prisma.player.findUnique({
    where: { username: session.user.name || '' },
  });
  if (!player) return { error: 'Player not found' };
  if (player.isAlive && player.health > 0)
    return { error: 'You are still alive' };

  // Death penalty softened from half your EC to a quarter: dying already costs
  // the player their momentum, and halving the wallet made recovery grim.
  const creditsLost = Math.floor(player.credits * 0.25);

  try {
    await prisma.$transaction(async (tx) => {
      await tx.activeEncounter.deleteMany({ where: { playerId: player.id } });

      const respawned = await tx.player.updateMany({
        where: {
          id: player.id,
          OR: [{ isAlive: false }, { health: { lte: 0 } }],
        },
        data: {
          isAlive: true,
          health: Math.floor(player.maxHealth * 0.6),
          energy: 60,
          hunger: Math.min(player.hunger, 40),
          thirst: Math.min(player.thirst, 40),
          fatigue: Math.min(player.fatigue, 30),
          sanity: Math.max(35, player.sanity),
          credits: { decrement: creditsLost },
        },
      });
      if (respawned.count === 0) throw new Error('You are still alive');

      await logNarrative(
        tx,
        player.id,
        creditsLost > 0
          ? `Marlow's people find you by the roadside and get you breathing again. Someone went through your pockets first — ${creditsLost} EC gone. The road does not care, but Marlow does.`
          : `Marlow's people find you by the roadside and get you breathing again. You had nothing left to steal.`
      );
    });
  } catch (error) {
    console.error('Failed to respawn:', error);
    return {
      error: error instanceof Error ? error.message : 'Failed to respawn',
    };
  }

  revalidatePath('/');
  return { success: true };
}
