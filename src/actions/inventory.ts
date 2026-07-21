'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

type EquipSlot = 'WEAPON' | 'HEAD' | 'CHEST' | 'LEGS' | null;

const MAX_HEALTH = 100;
const FIRST_AID_HEAL = 50;

export async function equipItem(instanceId: string, slot: EquipSlot) {
  const session = await auth();
  if (!session?.user?.name) {
    return { error: 'Unauthorized' };
  }

  const player = await prisma.player.findUnique({
    where: { username: session.user.name },
  });

  if (!player) {
    return { error: 'Player not found' };
  }

  const item = await prisma.playerInventory.findUnique({
    where: { instanceId },
  });

  if (!item || item.playerId !== player.id) {
    return { error: 'Item not found in inventory' };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // If equipping to a specific slot, unequip any currently equipped item in that slot
      if (slot !== null) {
        await tx.playerInventory.updateMany({
          where: {
            playerId: player.id,
            equipSlot: slot,
          },
          data: {
            equipSlot: null,
          },
        });
      }

      // Equip the new item
      await tx.playerInventory.update({
        where: { instanceId },
        data: { equipSlot: slot },
      });

      const actionText =
        slot === null ? `Unequipped item.` : `Equipped to ${slot}.`;

      // Log the event
      await tx.eventLog.create({
        data: {
          playerId: player.id,
          eventType: slot === null ? 'ITEM_UNEQUIPPED' : 'ITEM_EQUIPPED',
          payload: { instanceId, baseItemId: item.baseItemId, slot },
        },
      });

      await tx.eventLog.create({
        data: {
          playerId: player.id,
          eventType: 'SYSTEM_NARRATIVE',
          payload: { text: actionText },
        },
      });
    });

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Equip item failed:', error);
    return { error: 'Failed to equip item' };
  }
}

export async function consumeItem(instanceId: string) {
  const session = await auth();
  if (!session?.user?.name) {
    return { error: 'Unauthorized' };
  }

  const player = await prisma.player.findUnique({
    where: { username: session.user.name },
  });

  if (!player) {
    return { error: 'Player not found' };
  }
  if (!player.isAlive || player.health <= 0) {
    return { error: 'You are dead' };
  }

  const item = await prisma.playerInventory.findUnique({
    where: { instanceId },
  });

  if (!item || item.playerId !== player.id) {
    return { error: 'Item not found in inventory' };
  }
  if (item.baseItemId !== 'First Aid Kit') {
    return { error: 'That item cannot be used' };
  }
  if (player.health >= MAX_HEALTH) {
    return { error: 'Already at full health' };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const healed = await tx.player.updateMany({
        where: { id: player.id, health: { lt: MAX_HEALTH } },
        data: {
          health: Math.min(MAX_HEALTH, player.health + FIRST_AID_HEAL),
        },
      });
      if (healed.count === 0) throw new Error('Already at full health');

      if (item.quantity > 1) {
        await tx.playerInventory.update({
          where: { instanceId },
          data: { quantity: { decrement: 1 } },
        });
      } else {
        await tx.playerInventory.delete({ where: { instanceId } });
      }

      await tx.eventLog.create({
        data: {
          playerId: player.id,
          eventType: 'ITEM_USED',
          payload: { instanceId, baseItemId: item.baseItemId },
        },
      });

      await tx.eventLog.create({
        data: {
          playerId: player.id,
          eventType: 'SYSTEM_NARRATIVE',
          payload: {
            text: `You patch yourself up with a First Aid Kit, recovering ${FIRST_AID_HEAL} HP.`,
          },
        },
      });
    });

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Use item failed:', error);
    return { error: 'Failed to use item' };
  }
}

export async function dropItem(instanceId: string) {
  const session = await auth();
  if (!session?.user?.name) {
    return { error: 'Unauthorized' };
  }

  const player = await prisma.player.findUnique({
    where: { username: session.user.name },
  });

  if (!player) {
    return { error: 'Player not found' };
  }

  const item = await prisma.playerInventory.findUnique({
    where: { instanceId },
  });

  if (!item || item.playerId !== player.id) {
    return { error: 'Item not found in inventory' };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Delete from inventory projection
      await tx.playerInventory.delete({
        where: { instanceId },
      });

      // Log the drop event
      await tx.eventLog.create({
        data: {
          playerId: player.id,
          eventType: 'ITEM_DROPPED',
          payload: { instanceId, baseItemId: item.baseItemId },
        },
      });

      await tx.eventLog.create({
        data: {
          playerId: player.id,
          eventType: 'SYSTEM_NARRATIVE',
          payload: { text: `You dropped the item.` },
        },
      });
    });

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Drop item failed:', error);
    return { error: 'Failed to drop item' };
  }
}
