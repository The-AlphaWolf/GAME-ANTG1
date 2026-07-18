'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { progressQuests } from '@/actions/quests';

const FUEL_COST = 5;
const DISTANCE_GAIN = 10;
const SCAVENGE_ENERGY_COST = 5;

export async function explore() {
  const session = await auth();
  if (!session?.user?.name) return { error: 'Unauthorized' };

  const player = await prisma.player.findUnique({
    where: { username: session.user.name },
    include: { vehicle: true, activeEncounter: true, inventory: true },
  });

  if (!player) return { error: 'Player not found' };
  if (!player.isAlive || player.health <= 0) return { error: 'You are dead' };
  if (player.activeEncounter)
    return { error: 'Cannot explore while in combat' };
  if (!player.vehicle) return { error: 'You need a vehicle to explore' };
  if (player.vehicle.fuel < FUEL_COST)
    return { error: 'Not enough fuel to drive' };

  // Roll Encounter
  // 0.0 - 0.5: Empty
  // 0.5 - 0.8: Loot
  // 0.8 - 1.0: Combat
  const roll = Math.random();
  let eventType = 'empty';
  let scavengedAmount = 0;
  if (roll >= 0.8) eventType = 'combat';
  else if (roll >= 0.5) eventType = 'loot';

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Deduct fuel and add distance
      await tx.player.update({
        where: { id: player.id },
        data: { distanceTraveled: player.distanceTraveled + DISTANCE_GAIN },
      });

      await tx.vehicle.update({
        where: { id: player.vehicle!.id },
        data: { fuel: player.vehicle!.fuel - FUEL_COST },
      });

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
            data: { quantity: existingScrap.quantity + scavengedAmount },
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
        const hp = 50 + Math.floor(Math.random() * 20); // 50-70

        await tx.activeEncounter.create({
          data: {
            playerId: player.id,
            enemyName,
            enemyHp: hp,
            enemyMaxHp: hp,
            enemyAttack: 12,
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
    });

    if (eventType === 'loot' && scavengedAmount > 0) {
      await progressQuests(player.id, 'GATHER', 'Scrap Metal', scavengedAmount);
    }

    revalidatePath('/');
    return { success: true, eventType };
  } catch (error) {
    console.error('Explore failed:', error);
    return { error: 'Exploration failed' };
  }
}

export async function scavenge() {
  const session = await auth();
  if (!session?.user?.name) return { error: 'Unauthorized' };

  const player = await prisma.player.findUnique({
    where: { username: session.user.name },
    include: { activeEncounter: true, inventory: true },
  });

  if (!player) return { error: 'Player not found' };
  if (!player.isAlive || player.health <= 0) return { error: 'You are dead' };
  if (player.activeEncounter)
    return { error: 'Cannot scavenge while in combat' };
  if (player.energy < SCAVENGE_ENERGY_COST)
    return { error: 'Too exhausted to scavenge' };

  // Roll Outcome
  // 0.0 - 0.3: Nothing
  // 0.3 - 0.85: Loot
  // 0.85 - 1.0: Combat
  const roll = Math.random();
  let eventType = 'empty';
  let scavengedAmount = 0;
  if (roll >= 0.85) eventType = 'combat';
  else if (roll >= 0.3) eventType = 'loot';

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Deduct energy
      await tx.player.update({
        where: { id: player.id },
        data: { energy: player.energy - SCAVENGE_ENERGY_COST },
      });

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
            data: { quantity: existingScrap.quantity + scavengedAmount },
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
        const hp = 40 + Math.floor(Math.random() * 15); // 40-55

        await tx.activeEncounter.create({
          data: {
            playerId: player.id,
            enemyName,
            enemyHp: hp,
            enemyMaxHp: hp,
            enemyAttack: 10,
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
    });

    if (eventType === 'loot' && scavengedAmount > 0) {
      await progressQuests(player.id, 'GATHER', 'Scrap Metal', scavengedAmount);
    }

    revalidatePath('/');
    return { success: true, eventType };
  } catch (error) {
    console.error('Scavenge failed:', error);
    return { error: 'Scavenging failed' };
  }
}
