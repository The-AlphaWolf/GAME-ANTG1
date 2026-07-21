'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { grantStarterChest } from '@/lib/game/starter-chest';
import { parseIntent } from '@/lib/game/intent-parser';
import { maybePruneEventLog } from '@/lib/game/event-log';

const MAX_HEALTH = 100;
const MAX_STAT = 100;
const MAX_ARMOR = 100;
const MAX_FUEL = 100;

export async function submitAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.email) {
    return { error: 'Unauthorized' };
  }

  const actionText = formData.get('actionText') as string;
  if (!actionText || actionText.trim() === '') {
    return { error: 'Action text is required' };
  }

  const player = await prisma.player.findUnique({
    where: { username: session.user.name || '' },
    include: {
      vehicle: true,
      inventory: {
        where: {
          baseItemId: {
            in: [
              'Scrap Metal',
              'Small Rations',
              'Clean Water',
              'First Aid Kit',
              'Improvised Weapon',
            ],
          },
        },
      },
    },
  });

  if (!player) {
    return { error: 'Player not found' };
  }

  if (!player.isAlive || player.health <= 0) {
    return { error: 'You are dead' };
  }

  const intent = parseIntent(actionText);

  try {
    await prisma.$transaction(async (tx) => {
      await tx.eventLog.create({
        data: {
          playerId: player.id,
          eventType: 'PLAYER_ACTION',
          payload: { action: actionText },
        },
      });

      let narrativeText: string;

      switch (intent.type) {
        case 'REST': {
          if (player.hunger >= 70 || player.thirst >= 70) {
            throw new Error(
              'Too hungry or thirsty to rest. Eat or drink first.'
            );
          }
          const updated = await tx.player.updateMany({
            where: {
              id: player.id,
              isAlive: true,
              hunger: { lt: 70 },
              thirst: { lt: 70 },
            },
            data: {
              energy: { increment: Math.min(25, MAX_STAT - player.energy) },
              sanity: { increment: Math.min(10, MAX_STAT - player.sanity) },
              hunger: { increment: Math.min(5, MAX_STAT - player.hunger) },
              thirst: { increment: Math.min(5, MAX_STAT - player.thirst) },
            },
          });
          if (updated.count === 0) throw new Error('Cannot rest right now');
          narrativeText =
            'You pull over and rest a while. Energy and nerves settle, but the hunger and thirst creep in.';
          break;
        }

        case 'REPAIR': {
          if (!player.vehicle) throw new Error('You have no vehicle to repair');
          const scrap = player.inventory.find(
            (i) => i.baseItemId === 'Scrap Metal' && i.quantity >= 3
          );
          if (!scrap) throw new Error('Need 3 Scrap Metal to repair');

          const scrapUsed = await tx.playerInventory.updateMany({
            where: { instanceId: scrap.instanceId, quantity: { gte: 3 } },
            data: { quantity: { decrement: 3 } },
          });
          if (scrapUsed.count === 0)
            throw new Error('Need 3 Scrap Metal to repair');

          await tx.playerInventory.deleteMany({
            where: { instanceId: scrap.instanceId, quantity: { lte: 0 } },
          });

          await tx.vehicle.updateMany({
            where: { id: player.vehicle.id, armor: { lt: MAX_ARMOR } },
            data: {
              armor: {
                increment: Math.min(15, MAX_ARMOR - player.vehicle.armor),
              },
            },
          });
          narrativeText =
            'You strip 3 Scrap Metal and patch up the vehicle armor.';
          break;
        }

        case 'EAT': {
          const food = player.inventory.find(
            (i) => i.baseItemId === 'Small Rations' && i.quantity > 0
          );
          if (!food) throw new Error('No food to eat');

          const consumed = await tx.playerInventory.updateMany({
            where: { instanceId: food.instanceId, quantity: { gt: 0 } },
            data: { quantity: { decrement: 1 } },
          });
          if (consumed.count === 0) throw new Error('No food to eat');
          await tx.playerInventory.deleteMany({
            where: { instanceId: food.instanceId, quantity: { lte: 0 } },
          });

          await tx.player.updateMany({
            where: { id: player.id },
            data: { hunger: { decrement: Math.min(30, player.hunger) } },
          });
          narrativeText = 'You eat a Small Rations pack. The hunger fades.';
          break;
        }

        case 'DRINK': {
          const water = player.inventory.find(
            (i) => i.baseItemId === 'Clean Water' && i.quantity > 0
          );
          if (!water) throw new Error('No water to drink');

          const consumed = await tx.playerInventory.updateMany({
            where: { instanceId: water.instanceId, quantity: { gt: 0 } },
            data: { quantity: { decrement: 1 } },
          });
          if (consumed.count === 0) throw new Error('No water to drink');
          await tx.playerInventory.deleteMany({
            where: { instanceId: water.instanceId, quantity: { lte: 0 } },
          });

          await tx.player.updateMany({
            where: { id: player.id },
            data: { thirst: { decrement: Math.min(30, player.thirst) } },
          });
          narrativeText = 'You drink Clean Water. The thirst fades.';
          break;
        }

        case 'USE': {
          if (player.health >= MAX_HEALTH)
            throw new Error('Already at full health');
          const kit = player.inventory.find(
            (i) => i.baseItemId === 'First Aid Kit' && i.quantity > 0
          );
          if (!kit) throw new Error('No First Aid Kit to use');

          const healed = await tx.player.updateMany({
            where: { id: player.id, health: { lt: MAX_HEALTH } },
            data: {
              health: Math.min(MAX_HEALTH, player.health + 50),
            },
          });
          if (healed.count === 0) throw new Error('Already at full health');

          const consumed = await tx.playerInventory.updateMany({
            where: { instanceId: kit.instanceId, quantity: { gt: 0 } },
            data: { quantity: { decrement: 1 } },
          });
          if (consumed.count === 0) throw new Error('No First Aid Kit to use');
          await tx.playerInventory.deleteMany({
            where: { instanceId: kit.instanceId, quantity: { lte: 0 } },
          });

          narrativeText = 'You patch yourself up with a First Aid Kit.';
          break;
        }

        case 'EQUIP': {
          const weapon = player.inventory.find(
            (i) =>
              i.baseItemId === 'Improvised Weapon' && i.equipSlot !== 'WEAPON'
          );
          if (!weapon) throw new Error('No weapon to equip');

          await tx.playerInventory.updateMany({
            where: { playerId: player.id, equipSlot: 'WEAPON' },
            data: { equipSlot: null },
          });
          await tx.playerInventory.update({
            where: { instanceId: weapon.instanceId },
            data: { equipSlot: 'WEAPON' },
          });
          narrativeText = 'You ready your weapon.';
          break;
        }

        case 'SIPHON': {
          if (!player.vehicle) throw new Error('You have no vehicle');
          const scrap = player.inventory.find(
            (i) => i.baseItemId === 'Scrap Metal' && i.quantity >= 2
          );
          if (!scrap) throw new Error('Need 2 Scrap Metal to rig a siphon');

          const scrapUsed = await tx.playerInventory.updateMany({
            where: { instanceId: scrap.instanceId, quantity: { gte: 2 } },
            data: { quantity: { decrement: 2 } },
          });
          if (scrapUsed.count === 0)
            throw new Error('Need 2 Scrap Metal to rig a siphon');
          await tx.playerInventory.deleteMany({
            where: { instanceId: scrap.instanceId, quantity: { lte: 0 } },
          });

          await tx.vehicle.updateMany({
            where: { id: player.vehicle.id, fuel: { lt: MAX_FUEL } },
            data: {
              fuel: { increment: Math.min(15, MAX_FUEL - player.vehicle.fuel) },
            },
          });
          narrativeText = 'You rig a makeshift siphon and scavenge some fuel.';
          break;
        }

        case 'INSPECT': {
          narrativeText = `You take stock: ${player.health} HP, ${player.energy} energy, ${player.credits} EC, ${player.distanceTraveled} miles traveled.`;
          break;
        }

        case 'UNKNOWN':
        default: {
          const roll = Math.random();
          if (roll < 0.4) {
            narrativeText =
              'You find a half-burnt journal page, the ink barely legible. Something about a haven to the east...';
          } else if (roll < 0.8) {
            narrativeText = `You try to: "${actionText}". Nothing comes of it, but it passes the time.`;
          } else {
            const bonus = Math.floor(Math.random() * 2) + 1;
            await tx.player.updateMany({
              where: { id: player.id, energy: { gt: 0 } },
              data: { energy: { decrement: 1 } },
            });
            const existingScrap = player.inventory.find(
              (i) =>
                i.baseItemId === 'Scrap Metal' &&
                i.rarity === 'COMMON' &&
                !i.isUpgraded
            );
            if (existingScrap) {
              await tx.playerInventory.update({
                where: { instanceId: existingScrap.instanceId },
                data: { quantity: { increment: bonus } },
              });
            } else {
              await tx.playerInventory.create({
                data: {
                  playerId: player.id,
                  baseItemId: 'Scrap Metal',
                  quantity: bonus,
                },
              });
            }
            narrativeText = `While trying to "${actionText}", you stumble on ${bonus} Scrap Metal.`;
          }
          break;
        }
      }

      await tx.eventLog.create({
        data: {
          playerId: player.id,
          eventType: 'SYSTEM_NARRATIVE',
          payload: { text: narrativeText },
        },
      });

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

export async function restartGame() {
  const session = await auth();
  if (!session?.user?.email) {
    return { error: 'Unauthorized' };
  }

  const player = await prisma.player.findUnique({
    where: { username: session.user.name || '' },
  });

  if (!player) {
    return { error: 'Player not found' };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Wipe all progress
      await tx.activeEncounter.deleteMany({ where: { playerId: player.id } });
      await tx.playerInventory.deleteMany({ where: { playerId: player.id } });
      await tx.activeQuest.deleteMany({ where: { playerId: player.id } });
      await tx.eventLog.deleteMany({ where: { playerId: player.id } });
      await tx.vehicle.deleteMany({ where: { playerId: player.id } });

      // Reset player to a fresh state (schema defaults) with a new starter vehicle
      await tx.player.update({
        where: { id: player.id },
        data: {
          level: 1,
          xp: 0,
          health: 100,
          energy: 100,
          hunger: 0,
          sanity: 100,
          fatigue: 0,
          thirst: 0,
          isAlive: true,
          distanceTraveled: 0,
          credits: 0,
          upgradeCharges: 6,
          lastUpgradeReset: new Date(),
          vehicle: {
            create: {
              type: 'Common Van',
            },
          },
        },
      });

      await tx.eventLog.create({
        data: {
          playerId: player.id,
          eventType: 'SYSTEM_NARRATIVE',
          payload: {
            text: 'A new journey begins. Your van hums to life on the empty highway, everything you once carried now a memory.',
          },
        },
      });

      // Fresh start comes with a fresh beginner treasure chest
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
  if (!session?.user?.email) {
    return { error: 'Unauthorized' };
  }

  const player = await prisma.player.findUnique({
    where: { username: session.user.name || '' },
  });

  if (!player) {
    return { error: 'Player not found' };
  }

  // Only allow respawning when actually dead (isAlive false, or stuck at 0 hp)
  if (player.isAlive && player.health > 0) {
    return { error: 'You are still alive' };
  }

  // Death penalty: lose half your credits
  const creditsLost = Math.floor(player.credits / 2);

  try {
    await prisma.$transaction(async (tx) => {
      // Clear any lingering encounter
      await tx.activeEncounter.deleteMany({ where: { playerId: player.id } });

      // Guarded against double-submit: only respawn a player still actually dead
      const respawned = await tx.player.updateMany({
        where: {
          id: player.id,
          OR: [{ isAlive: false }, { health: { lte: 0 } }],
        },
        data: {
          isAlive: true,
          health: 50,
          energy: 50,
          sanity: Math.max(25, player.sanity),
          credits: { decrement: creditsLost },
        },
      });
      if (respawned.count === 0) throw new Error('You are still alive');

      await tx.eventLog.create({
        data: {
          playerId: player.id,
          eventType: 'SYSTEM_NARRATIVE',
          payload: {
            text:
              creditsLost > 0
                ? `You wake up battered by the roadside. Someone went through your pockets — ${creditsLost} EC gone. The road doesn't care.`
                : `You wake up battered by the roadside. The road doesn't care.`,
          },
        },
      });
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
