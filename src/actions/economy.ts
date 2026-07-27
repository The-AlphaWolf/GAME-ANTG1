'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { getItemPrice, getShopBuyPrice, getShopItem } from '@/lib/game/economy';
import { chapterForMiles } from '@/lib/game/story';
import { grantItems, logNarrative } from '@/lib/game/engine';

export async function sellItem(instanceId: string, quantity: number = 1) {
  const session = await auth();
  if (!session?.user?.name) return { error: 'Unauthorized' };

  const player = await prisma.player.findUnique({
    where: { username: session.user.name },
  });
  if (!player) return { error: 'Player not found' };

  const item = await prisma.playerInventory.findUnique({
    where: { instanceId },
  });
  if (!item || item.playerId !== player.id)
    return { error: 'Item not found in inventory' };
  if (item.equipSlot) return { error: 'Cannot sell equipped items' };

  const amount = Math.max(1, Math.min(Math.floor(quantity), item.quantity));
  const unitPrice = getItemPrice(item.baseItemId, item.rarity);
  const total = unitPrice * amount;

  try {
    await prisma.$transaction(async (tx) => {
      const sold = await tx.playerInventory.updateMany({
        where: { instanceId, quantity: { gte: amount } },
        data: { quantity: { decrement: amount } },
      });
      if (sold.count === 0) throw new Error('Not enough of that item');

      await tx.playerInventory.deleteMany({
        where: { instanceId, quantity: { lte: 0 } },
      });

      await tx.player.update({
        where: { id: player.id },
        data: { credits: { increment: total } },
      });

      await logNarrative(
        tx,
        player.id,
        `Boone takes ${amount}x ${item.rarity !== 'COMMON' ? `${item.rarity} ` : ''}${item.baseItemId} off your hands for ${total} EC.`
      );
    });

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Selling failed:', error);
    return {
      error: error instanceof Error ? error.message : 'Transaction failed',
    };
  }
}

export async function buyItem(baseItemId: string, quantity: number = 1) {
  const session = await auth();
  if (!session?.user?.name) return { error: 'Unauthorized' };

  const player = await prisma.player.findUnique({
    where: { username: session.user.name },
  });
  if (!player) return { error: 'Player not found' };
  if (!player.isAlive || player.health <= 0) return { error: 'You are dead' };

  const shopItem = getShopItem(baseItemId);
  if (!shopItem) return { error: 'Item not sold here' };

  const chapter = chapterForMiles(player.distanceTraveled).number;
  if ((shopItem.fromChapter ?? 1) > chapter) {
    return { error: 'Boone does not stock that this far west.' };
  }

  const amount = Math.max(1, Math.min(Math.floor(quantity), 99));
  const total = getShopBuyPrice(baseItemId) * amount;
  if (player.credits < total) return { error: 'Not enough EC' };

  try {
    await prisma.$transaction(async (tx) => {
      const paid = await tx.player.updateMany({
        where: { id: player.id, credits: { gte: total } },
        data: { credits: { decrement: total } },
      });
      if (paid.count === 0) throw new Error('Not enough EC');

      await grantItems(tx, player.id, [{ baseItemId, quantity: amount }]);

      await logNarrative(
        tx,
        player.id,
        `You buy ${amount}x ${baseItemId} for ${total} EC.`
      );
    });

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Buying failed:', error);
    return {
      error: error instanceof Error ? error.message : 'Transaction failed',
    };
  }
}
