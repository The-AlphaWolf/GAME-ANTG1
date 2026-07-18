'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { getItemPrice, getShopBuyPrice, getShopItem } from '@/lib/game/economy';

export async function sellItem(instanceId: string) {
  const session = await auth();
  if (!session?.user?.name) return { error: 'Unauthorized' };

  const player = await prisma.player.findUnique({
    where: { username: session.user.name },
    include: { inventory: true },
  });

  if (!player) return { error: 'Player not found' };

  const itemToSell = player.inventory.find((i) => i.instanceId === instanceId);
  if (!itemToSell) return { error: 'Item not found in inventory' };

  if (itemToSell.equipSlot) return { error: 'Cannot sell equipped items' };

  const itemPrice = getItemPrice(itemToSell.baseItemId, itemToSell.rarity);

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Deduct item
      if (itemToSell.quantity === 1) {
        await tx.playerInventory.delete({
          where: { instanceId: itemToSell.instanceId },
        });
      } else {
        await tx.playerInventory.update({
          where: { instanceId: itemToSell.instanceId },
          data: { quantity: itemToSell.quantity - 1 },
        });
      }

      // 2. Add credits
      await tx.player.update({
        where: { id: player.id },
        data: { credits: player.credits + itemPrice },
      });

      // 3. Log event
      await tx.eventLog.create({
        data: {
          playerId: player.id,
          eventType: 'SYSTEM_NARRATIVE',
          payload: {
            text: `Sold 1x ${itemToSell.baseItemId} for ${itemPrice} EC.`,
          },
        },
      });
    });

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Selling failed:', error);
    return { error: 'Transaction failed' };
  }
}

export async function buyItem(baseItemId: string) {
  const session = await auth();
  if (!session?.user?.name) return { error: 'Unauthorized' };

  const player = await prisma.player.findUnique({
    where: { username: session.user.name },
    include: { inventory: true },
  });

  if (!player) return { error: 'Player not found' };
  if (!player.isAlive || player.health <= 0) return { error: 'You are dead' };

  // Only items listed in the shop catalog can be bought
  const shopItem = getShopItem(baseItemId);
  if (!shopItem) return { error: 'Item not sold here' };

  const price = getShopBuyPrice(baseItemId);
  if (player.credits < price) return { error: 'Not enough EC' };

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Deduct credits
      await tx.player.update({
        where: { id: player.id },
        data: { credits: player.credits - price },
      });

      // 2. Add item to inventory (stack with existing common, non-upgraded items)
      const existingStack = player.inventory.find(
        (i) =>
          i.baseItemId === baseItemId &&
          i.rarity === 'COMMON' &&
          !i.isUpgraded &&
          !i.equipSlot
      );

      if (existingStack) {
        await tx.playerInventory.update({
          where: { instanceId: existingStack.instanceId },
          data: { quantity: existingStack.quantity + 1 },
        });
      } else {
        await tx.playerInventory.create({
          data: {
            playerId: player.id,
            baseItemId,
            quantity: 1,
          },
        });
      }

      // 3. Log event
      await tx.eventLog.create({
        data: {
          playerId: player.id,
          eventType: 'SYSTEM_NARRATIVE',
          payload: {
            text: `Bought 1x ${baseItemId} for ${price} EC.`,
          },
        },
      });
    });

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Buying failed:', error);
    return { error: 'Transaction failed' };
  }
}
