'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { progressQuests } from '@/actions/quests';
import { maybePruneEventLog } from '@/lib/game/event-log';
import { crossedStoryBeats, scaleEnemyStat } from '@/lib/game/story';

const FUEL_COST = 5;
const DISTANCE_GAIN = 10;
const SCAVENGE_ENERGY_COST = 5;

export async function explore() {
  const session = await auth();
  if (!session?.user?.name) return { error: 'Unauthorized' };

  const player = await prisma.player.findUnique({
    where: { username: session.user.name },
    include: {
      vehicle: true,
      activeEncounter: true,
      inventory: {
        where: {
          baseItemId: 'Scrap Metal',
          rarity: 'COMMON',
          isUpgraded: false,
        },
      },
    },
  });

  if (!player) return { error: 'Player not found' };
  if (!player.isAlive || player.health <= 0) return { error: 'You are dead' };
  if (player.activeEncounter)
    return { error: 'Cannot explore while in combat' };
  if (!player.vehicle) return { error: 'You need a vehicle to explore' };
  if (player.vehicle.fuel < FUEL_COST)
    return { error: 'Not enough fuel to drive' };

  // Roll Encounter
  // 0.0 - 0.45: Empty
  // 0.45 - 0.85: Loot
  // 0.85 - 1.0: Combat
  const roll = Math.random();
  let eventType = 'empty';
  let scavengedAmount = 0;
  if (roll >= 0.85) eventType = 'combat';
  else if (roll >= 0.45) eventType = 'loot';

  const storyBeats = crossedStoryBeats(
    player.distanceTraveled,
    player.distanceTraveled + DISTANCE_GAIN
  );

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Deduct fuel and add distance, guarded against stale reads / double-submit
      const playerUpdated = await tx.player.updateMany({
        where: { id: player.id, isAlive: true, health: { gt: 0 } },
        data: { distanceTraveled: { increment: DISTANCE_GAIN } },
      });
      if (playerUpdated.count === 0) throw new Error('You are dead');

      const fuelUpdated = await tx.vehicle.updateMany({
        where: { id: player.vehicle!.id, fuel: { gte: FUEL_COST } },
        data: { fuel: { decrement: FUEL_COST } },
      });
      if (fuelUpdated.count === 0) throw new Error('Not enough fuel to drive');

      // 2. Handle Encounter
      if (eventType === 'empty') {
        await tx.eventLog.create({
          data: {
            playerId: player.id,
            eventType: 'SYSTEM_NARRATIVE',
            payload: {
              text: `You drive ${DISTANCE_GAIN} miles down the desolate highway. Nothing but wind and dust.`,
            },
          },
        });
      } else if (eventType === 'loot') {
        // Give 1-3 Scrap Metal
        scavengedAmount = Math.floor(Math.random() * 3) + 1;
        const existingScrap = player.inventory.find(
          (i) =>
            i.baseItemId === 'Scrap Metal' &&
            i.rarity === 'COMMON' &&
            !i.isUpgraded
        );

        if (existingScrap) {
          await tx.playerInventory.update({
            where: { instanceId: existingScrap.instanceId },
            data: { quantity: { increment: scavengedAmount } },
          });
        } else {
          await tx.playerInventory.create({
            data: {
              playerId: player.id,
              baseItemId: 'Scrap Metal',
              quantity: scavengedAmount,
            },
          });
        }

        await tx.eventLog.create({
          data: {
            playerId: player.id,
            eventType: 'SYSTEM_NARRATIVE',
            payload: {
              text: `You spot an abandoned car and scavenge ${scavengedAmount} Scrap Metal.`,
            },
          },
        });
      } else if (eventType === 'combat') {
        const enemyName = 'Highway Raider';
        const hp = scaleEnemyStat(
          35 + Math.floor(Math.random() * 15),
          player.level,
          1.5
        ); // base 35-50, +1.5/level
        const attack = scaleEnemyStat(8, player.level, 0.3);

        await tx.activeEncounter.create({
          data: {
            playerId: player.id,
            enemyName,
            enemyHp: hp,
            enemyMaxHp: hp,
            enemyAttack: attack,
          },
        });

        await tx.eventLog.create({
          data: {
            playerId: player.id,
            eventType: 'SYSTEM_NARRATIVE',
            payload: { text: `AMBUSH! A ${enemyName} blocks the road!` },
          },
        });
      }

      for (const beat of storyBeats) {
        await tx.eventLog.create({
          data: {
            playerId: player.id,
            eventType: 'SYSTEM_NARRATIVE',
            payload: { text: beat.text },
          },
        });
      }

      await maybePruneEventLog(tx, player.id);
    });

    if (eventType === 'loot' && scavengedAmount > 0) {
      await progressQuests(player.id, 'GATHER', 'Scrap Metal', scavengedAmount);
    }

    revalidatePath('/');
    return { success: true, eventType };
  } catch (error) {
    console.error('Explore failed:', error);
    return {
      error: error instanceof Error ? error.message : 'Exploration failed',
    };
  }
}

export async function scavenge() {
  const session = await auth();
  if (!session?.user?.name) return { error: 'Unauthorized' };

  const player = await prisma.player.findUnique({
    where: { username: session.user.name },
    include: {
      activeEncounter: true,
      inventory: {
        where: {
          baseItemId: 'Scrap Metal',
          rarity: 'COMMON',
          isUpgraded: false,
        },
      },
    },
  });

  if (!player) return { error: 'Player not found' };
  if (!player.isAlive || player.health <= 0) return { error: 'You are dead' };
  if (player.activeEncounter)
    return { error: 'Cannot scavenge while in combat' };
  if (player.energy < SCAVENGE_ENERGY_COST)
    return { error: 'Too exhausted to scavenge' };

  // Roll Outcome
  // 0.0 - 0.3: Nothing
  // 0.3 - 0.9: Loot
  // 0.9 - 1.0: Combat
  const roll = Math.random();
  let eventType = 'empty';
  let scavengedAmount = 0;
  if (roll >= 0.9) eventType = 'combat';
  else if (roll >= 0.3) eventType = 'loot';

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Deduct energy, guarded against stale reads / double-submit
      const energyUpdated = await tx.player.updateMany({
        where: {
          id: player.id,
          isAlive: true,
          health: { gt: 0 },
          energy: { gte: SCAVENGE_ENERGY_COST },
        },
        data: { energy: { decrement: SCAVENGE_ENERGY_COST } },
      });
      if (energyUpdated.count === 0)
        throw new Error('Too exhausted to scavenge');

      // 2. Handle Outcome
      if (eventType === 'empty') {
        await tx.eventLog.create({
          data: {
            playerId: player.id,
            eventType: 'SYSTEM_NARRATIVE',
            payload: {
              text: 'You comb through the wreckage nearby but find nothing of value.',
            },
          },
        });
      } else if (eventType === 'loot') {
        scavengedAmount = Math.floor(Math.random() * 2) + 1;
        const existingScrap = player.inventory.find(
          (i) =>
            i.baseItemId === 'Scrap Metal' &&
            i.rarity === 'COMMON' &&
            !i.isUpgraded
        );

        if (existingScrap) {
          await tx.playerInventory.update({
            where: { instanceId: existingScrap.instanceId },
            data: { quantity: { increment: scavengedAmount } },
          });
        } else {
          await tx.playerInventory.create({
            data: {
              playerId: player.id,
              baseItemId: 'Scrap Metal',
              quantity: scavengedAmount,
            },
          });
        }

        await tx.eventLog.create({
          data: {
            playerId: player.id,
            eventType: 'SYSTEM_NARRATIVE',
            payload: {
              text: `You dig through the debris and salvage ${scavengedAmount} Scrap Metal.`,
            },
          },
        });
      } else if (eventType === 'combat') {
        const enemyName = 'Feral Scavenger';
        const hp = scaleEnemyStat(
          25 + Math.floor(Math.random() * 10),
          player.level,
          1
        ); // base 25-35, +1/level
        const attack = scaleEnemyStat(6, player.level, 0.2);

        await tx.activeEncounter.create({
          data: {
            playerId: player.id,
            enemyName,
            enemyHp: hp,
            enemyMaxHp: hp,
            enemyAttack: attack,
          },
        });

        await tx.eventLog.create({
          data: {
            playerId: player.id,
            eventType: 'SYSTEM_NARRATIVE',
            payload: {
              text: `A ${enemyName} was hiding in the wreckage and lunges at you!`,
            },
          },
        });
      }

      await maybePruneEventLog(tx, player.id);
    });

    if (eventType === 'loot' && scavengedAmount > 0) {
      await progressQuests(player.id, 'GATHER', 'Scrap Metal', scavengedAmount);
    }

    revalidatePath('/');
    return { success: true, eventType };
  } catch (error) {
    console.error('Scavenge failed:', error);
    return {
      error: error instanceof Error ? error.message : 'Scavenging failed',
    };
  }
}
