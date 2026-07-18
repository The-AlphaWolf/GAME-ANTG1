'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { RECIPES } from '@/lib/game/crafting-recipes';

export async function craftItem(recipeId: string) {
  const session = await auth();
  if (!session?.user?.name) return { error: 'Unauthorized' };

  const recipe = RECIPES.find((r) => r.id === recipeId);
  if (!recipe) return { error: 'Recipe not found' };

  const player = await prisma.player.findUnique({
    where: { username: session.user.name },
    include: { inventory: true },
  });

  if (!player) return { error: 'Player not found' };

  // Verify materials
  for (const req of recipe.ingredients) {
    const item = player.inventory.find((i) => i.baseItemId === req.baseItemId);
    if (!item || item.quantity < req.quantity) {
      return { error: `Missing required materials: ${req.baseItemId}` };
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Deduct materials
      for (const req of recipe.ingredients) {
        const item = player.inventory.find(
          (i) => i.baseItemId === req.baseItemId
        )!;
        if (item.quantity === req.quantity) {
          // Delete row if exactly matches
          await tx.playerInventory.delete({
            where: { instanceId: item.instanceId },
          });
        } else {
          // Decrement
          await tx.playerInventory.update({
            where: { instanceId: item.instanceId },
            data: { quantity: item.quantity - req.quantity },
          });
        }
      }

      // 2. Add crafted item
      const existingOutput = player.inventory.find(
        (i) => i.baseItemId === recipe.outputItemId
      );

      if (existingOutput) {
        await tx.playerInventory.update({
          where: { instanceId: existingOutput.instanceId },
          data: { quantity: existingOutput.quantity + recipe.outputQuantity },
        });
      } else {
        await tx.playerInventory.create({
          data: {
            playerId: player.id,
            baseItemId: recipe.outputItemId,
            quantity: recipe.outputQuantity,
          },
        });
      }

      // 3. Log event
      await tx.eventLog.create({
        data: {
          playerId: player.id,
          eventType: 'SYSTEM_NARRATIVE',
          payload: { text: `You successfully crafted: ${recipe.name}.` },
        },
      });
    });

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Crafting failed:', error);
    return { error: 'Crafting failed' };
  }
}
