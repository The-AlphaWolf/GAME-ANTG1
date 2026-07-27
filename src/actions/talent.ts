'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import {
  DAILY_CHARGES,
  chargeCostFor,
  creditCostFor,
  isMaxRarity,
  rollUpgrade,
} from '@/lib/game/talent';
import { logNarrative } from '@/lib/game/engine';

/** Rolls the daily charge allowance over once UTC midnight has passed. */
export async function checkAndResetCharges(playerId: string) {
  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player) return;

  const nextMidnight = new Date(player.lastUpgradeReset);
  nextMidnight.setUTCHours(24, 0, 0, 0);

  if (new Date() >= nextMidnight) {
    await prisma.player.update({
      where: { id: playerId },
      data: { upgradeCharges: DAILY_CHARGES, lastUpgradeReset: new Date() },
    });
  }
}

export async function upgradeTalent(
  targetId: string,
  targetType: 'inventory' | 'vehicle'
) {
  const session = await auth();
  if (!session?.user?.name) return { error: 'Unauthorized' };

  const found = await prisma.player.findUnique({
    where: { username: session.user.name },
  });
  if (!found) return { error: 'Player not found' };

  await checkAndResetCharges(found.id);

  const player = await prisma.player.findUnique({ where: { id: found.id } });
  if (!player) return { error: 'Player not found' };

  try {
    let resultMessage = '';

    await prisma.$transaction(async (tx) => {
      // 1. Read target
      let currentRarity;
      let itemName: string;

      if (targetType === 'inventory') {
        const item = await tx.playerInventory.findUnique({
          where: { instanceId: targetId },
        });
        if (!item || item.playerId !== player.id)
          throw new Error('Item not found');
        currentRarity = item.rarity;
        itemName = item.baseItemId;
      } else {
        const component = await tx.vehicleComponent.findUnique({
          where: { id: targetId },
          include: { vehicle: true },
        });
        if (!component || component.vehicle.playerId !== player.id)
          throw new Error('Component not found');
        currentRarity = component.rarity;
        itemName = component.name;
      }

      if (isMaxRarity(currentRarity)) {
        throw new Error('Already at the maximum Mythical rarity.');
      }

      // 2. Pay costs
      const charges = chargeCostFor(currentRarity);
      const credits = creditCostFor(currentRarity);

      if (player.upgradeCharges < charges) {
        throw new Error(
          `Need ${charges} charges to push a ${currentRarity} item; you have ${player.upgradeCharges}.`
        );
      }
      if (player.credits < credits) {
        throw new Error(
          `Need ${credits} EC to stabilise a ${currentRarity} upgrade; you have ${player.credits}.`
        );
      }

      const paid = await tx.player.updateMany({
        where: {
          id: player.id,
          upgradeCharges: { gte: charges },
          credits: { gte: credits },
        },
        data: {
          upgradeCharges: { decrement: charges },
          credits: { decrement: credits },
        },
      });
      if (paid.count === 0) throw new Error('Not enough charges or EC');

      // 3. Roll
      const roll = rollUpgrade(currentRarity);
      resultMessage = roll.jackpot
        ? `JACKPOT — your SSS Talent catches something far bigger than it should. ${itemName} is now MYTHICAL.`
        : `${itemName} pushed ${roll.tiersGained} tier(s) to ${roll.finalRarity}. Cost: ${charges} charge(s), ${credits} EC.`;

      // 4. Apply
      if (targetType === 'inventory') {
        await tx.playerInventory.update({
          where: { instanceId: targetId },
          data: {
            rarity: roll.finalRarity,
            isUpgraded: true,
            upgradeCount: { increment: 1 },
          },
        });
      } else {
        await tx.vehicleComponent.update({
          where: { id: targetId },
          data: {
            rarity: roll.finalRarity,
            isUpgraded: true,
            upgradeCount: { increment: 1 },
          },
        });
      }

      await logNarrative(tx, player.id, resultMessage, 'TALENT_USED');
    });

    revalidatePath('/');
    return { success: true, message: resultMessage };
  } catch (error) {
    const e = error as Error;
    return { error: e.message || 'Failed to upgrade item.' };
  }
}
