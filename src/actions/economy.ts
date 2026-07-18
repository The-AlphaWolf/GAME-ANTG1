'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { getItemPrice } from '@/lib/game/economy';

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

  const itemPrice = getItemPrice(itemToSell.baseItemId);

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
