'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { RECIPES } from '@/lib/game/crafting-recipes';
import { chapterForMiles } from '@/lib/game/story';
import { awardXp, grantItems, logNarrative } from '@/lib/game/engine';

const CRAFT_XP = 12;

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

  const chapter = chapterForMiles(player.distanceTraveled).number;
  if ((recipe.chapter ?? 1) > chapter) {
    return { error: 'You have not learned that yet.' };
  }

  // Ingredients can be spread across several stacks of the same base item
  // (different rarities), so totals are counted rather than a single row.
  const stacksFor = (baseItemId: string) =>
    player.inventory.filter((i) => i.baseItemId === baseItemId && !i.equipSlot);

  for (const req of recipe.ingredients) {
    const held = stacksFor(req.baseItemId).reduce(
      (sum, i) => sum + i.quantity,
      0
    );
    if (held < req.quantity) {
      return { error: `Missing materials: ${req.quantity}x ${req.baseItemId}` };
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      for (const req of recipe.ingredients) {
        let remaining = req.quantity;
        for (const stack of stacksFor(req.baseItemId)) {
          if (remaining <= 0) break;
          const take = Math.min(remaining, stack.quantity);
          const taken = await tx.playerInventory.updateMany({
            where: { instanceId: stack.instanceId, quantity: { gte: take } },
            data: { quantity: { decrement: take } },
          });
          if (taken.count === 0) continue;
          remaining -= take;
        }
        if (remaining > 0)
          throw new Error(`Missing materials: ${req.baseItemId}`);
      }

      await tx.playerInventory.deleteMany({
        where: { playerId: player.id, quantity: { lte: 0 } },
      });

      await grantItems(tx, player.id, [
        { baseItemId: recipe.outputItemId, quantity: recipe.outputQuantity },
      ]);

      await logNarrative(
        tx,
        player.id,
        `You work at the tailgate bench and put together ${recipe.outputQuantity}x ${recipe.outputItemId}.`
      );

      const xp = await awardXp(tx, player, CRAFT_XP);
      if (xp.narrative)
        await logNarrative(tx, player.id, xp.narrative, 'LEVEL_UP');
    });

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Crafting failed:', error);
    return {
      error: error instanceof Error ? error.message : 'Crafting failed',
    };
  }
}
