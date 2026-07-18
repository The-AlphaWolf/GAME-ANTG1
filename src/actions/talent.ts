'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { getNextRarity } from '@/lib/game/rarity';

export async function checkAndResetCharges(playerId: string) {
  const player = await prisma.player.findUnique({
    where: { id: playerId },
  });

  if (!player) return;

  const now = new Date();
  const lastReset = player.lastUpgradeReset;

  // Check if we've passed midnight since last reset
  const nextMidnight = new Date(lastReset);
  nextMidnight.setUTCHours(24, 0, 0, 0); // Next midnight in UTC

  if (now >= nextMidnight) {
    await prisma.player.update({
      where: { id: playerId },
      data: {
        upgradeCharges: 6,
        lastUpgradeReset: now,
      },
    });
  }
}

export async function upgradeTalent(
  targetId: string,
  targetType: 'inventory' | 'vehicle'
) {
  const session = await auth();
  if (!session?.user?.name) return { error: 'Unauthorized' };

  const player = await prisma.player.findUnique({
    where: { username: session.user.name },
  });

  if (!player) return { error: 'Player not found' };

  // Run midnight check
  await checkAndResetCharges(player.id);

  // Re-fetch player to get updated charges if they reset
  const updatedPlayer = await prisma.player.findUnique({
    where: { id: player.id },
  });

  if (!updatedPlayer || updatedPlayer.upgradeCharges <= 0) {
    return { error: 'No upgrade charges remaining for today.' };
  }

  try {
    let resultMessage = '';

    await prisma.$transaction(async (tx) => {
      let currentRarity;
      let isUpgraded;
      let itemName = '';

      // 1. Fetch Target
      if (targetType === 'inventory') {
        const item = await tx.playerInventory.findUnique({
          where: { instanceId: targetId },
        });
        if (!item || item.playerId !== player.id)
          throw new Error('Item not found');
        currentRarity = item.rarity;
        isUpgraded = item.isUpgraded;
        itemName = item.baseItemId;
      } else {
        const comp = await tx.vehicleComponent.findUnique({
          where: { id: targetId },
          include: { vehicle: true },
        });
        if (!comp || comp.vehicle.playerId !== player.id)
          throw new Error('Component not found');
        currentRarity = comp.rarity;
        isUpgraded = comp.isUpgraded;
        itemName = comp.name;
      }

      if (isUpgraded) {
        throw new Error('This item has already been upgraded by your talent.');
      }

      if (currentRarity === 'MYTHICAL') {
        throw new Error('Item is already at the maximum Mythical rarity.');
      }

      // 2. Perform Rolls
      let finalRarity = getNextRarity(currentRarity)!; // Primary roll (100%)
      let tiersGained = 1;

      // Secondary Roll (30%)
      if (finalRarity !== 'MYTHICAL' && Math.random() < 0.3) {
        finalRarity = getNextRarity(finalRarity)!;
        tiersGained++;

        // Tertiary Roll (5%)
        if (finalRarity !== 'MYTHICAL' && Math.random() < 0.05) {
          finalRarity = getNextRarity(finalRarity)!;
          tiersGained++;
        }
      }

      // Gacha Roll (0.05%) - Supercedes all previous if it hits
      if (Math.random() < 0.0005) {
        finalRarity = 'MYTHICAL';
        resultMessage = `JACKPOT! Your SSS Talent resonated with the cosmos. ${itemName} instantly became MYTHICAL!`;
      } else {
        resultMessage = `Successfully upgraded ${itemName} by ${tiersGained} tier(s) to ${finalRarity}!`;
      }

      // 3. Update Target
      if (targetType === 'inventory') {
        await tx.playerInventory.update({
          where: { instanceId: targetId },
          data: {
            rarity: finalRarity,
            isUpgraded: true,
          },
        });
      } else {
        await tx.vehicleComponent.update({
          where: { id: targetId },
          data: {
            rarity: finalRarity,
            isUpgraded: true,
          },
        });
      }

      // 4. Consume Charge and Log
      await tx.player.update({
        where: { id: player.id },
        data: { upgradeCharges: { decrement: 1 } },
      });

      await tx.eventLog.create({
        data: {
          playerId: player.id,
          eventType: 'TALENT_USED',
          payload: { text: resultMessage },
        },
      });
    });

    revalidatePath('/');
    return { success: true, message: resultMessage };
  } catch (error: unknown) {
    const e = error as Error;
    return { error: e.message || 'Failed to upgrade item.' };
  }
}
