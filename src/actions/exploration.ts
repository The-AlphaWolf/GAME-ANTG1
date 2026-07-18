'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

const FUEL_COST = 5;
const DISTANCE_GAIN = 10;

export async function explore() {
  const session = await auth();
  if (!session?.user?.name) return { error: 'Unauthorized' };

  const player = await prisma.player.findUnique({
    where: { username: session.user.name },
    include: { vehicle: true, activeEncounter: true, inventory: true },
  });

  if (!player) return { error: 'Player not found' };
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
        const amount = Math.floor(Math.random() * 3) + 1;
        const existingScrap = player.inventory.find(
          (i) => i.baseItemId === 'Scrap Metal'
        );

        if (existingScrap) {
          await tx.playerInventory.update({
            where: { instanceId: existingScrap.instanceId },
            data: { quantity: existingScrap.quantity + amount },
          });
        } else {
          await tx.playerInventory.create({
            data: {
              playerId: player.id,
              baseItemId: 'Scrap Metal',
              quantity: amount,
            },
          });
        }

        await tx.eventLog.create({
          data: {
            playerId: player.id,
            eventType: 'SYSTEM_NARRATIVE',
            payload: {
              text: `You spot an abandoned car and scavenge ${amount} Scrap Metal.`,
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

    revalidatePath('/');
    return { success: true, eventType };
  } catch (error) {
    console.error('Explore failed:', error);
    return { error: 'Exploration failed' };
  }
}
