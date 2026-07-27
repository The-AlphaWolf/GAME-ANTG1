'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { ITEMS, getEquipSlot } from '@/lib/game/items';
import { clamp, logNarrative } from '@/lib/game/engine';

type EquipSlot = 'WEAPON' | 'HEAD' | 'CHEST' | 'LEGS' | null;

const MAX_FUEL = 100;
const MAX_ARMOR = 100;

export async function equipItem(instanceId: string, slot: EquipSlot) {
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

  // Slot is derived from the item registry so a helmet can never be equipped
  // as a weapon just because the client asked nicely.
  const targetSlot =
    slot === null ? null : (getEquipSlot(item.baseItemId) ?? null);
  if (slot !== null && targetSlot === null) {
    return { error: 'That item cannot be equipped' };
  }

  try {
    await prisma.$transaction(async (tx) => {
      if (targetSlot !== null) {
        await tx.playerInventory.updateMany({
          where: { playerId: player.id, equipSlot: targetSlot },
          data: { equipSlot: null },
        });
      }

      await tx.playerInventory.update({
        where: { instanceId },
        data: { equipSlot: targetSlot },
      });

      await logNarrative(
        tx,
        player.id,
        targetSlot === null
          ? `You stow the ${item.baseItemId}.`
          : `You equip the ${item.rarity} ${item.baseItemId}.`,
        targetSlot === null ? 'ITEM_UNEQUIPPED' : 'ITEM_EQUIPPED'
      );
    });

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Equip item failed:', error);
    return { error: 'Failed to equip item' };
  }
}

/** Uses any item with effects — food, water, medical, fuel, repair kits.
 * Previously hardcoded to First Aid Kit, which left every other consumable
 * in the game unusable from the inventory screen. */
export async function consumeItem(instanceId: string) {
  const session = await auth();
  if (!session?.user?.name) return { error: 'Unauthorized' };

  const player = await prisma.player.findUnique({
    where: { username: session.user.name },
    include: { vehicle: true },
  });
  if (!player) return { error: 'Player not found' };
  if (!player.isAlive || player.health <= 0) return { error: 'You are dead' };

  const item = await prisma.playerInventory.findUnique({
    where: { instanceId },
  });
  if (!item || item.playerId !== player.id)
    return { error: 'Item not found in inventory' };

  const def = ITEMS[item.baseItemId];
  const effects = def?.effects;
  if (!effects) return { error: 'That item cannot be used' };

  if (effects.fuel && !player.vehicle) return { error: 'You have no vehicle' };
  if (effects.fuel && player.vehicle!.fuel >= MAX_FUEL)
    return { error: 'Tank is already full' };
  if (effects.armor && !player.vehicle) return { error: 'You have no vehicle' };
  if (effects.armor && player.vehicle!.armor >= MAX_ARMOR)
    return { error: 'The van is already in good shape' };
  if (
    effects.health &&
    effects.health > 0 &&
    !effects.thirst &&
    !effects.hunger &&
    player.health >= player.maxHealth
  ) {
    return { error: 'Already at full health' };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const consumed = await tx.playerInventory.updateMany({
        where: { instanceId, quantity: { gt: 0 } },
        data: { quantity: { decrement: 1 } },
      });
      if (consumed.count === 0) throw new Error('None left to use');
      await tx.playerInventory.deleteMany({
        where: { instanceId, quantity: { lte: 0 } },
      });

      const playerData: Record<string, number> = {};
      if (effects.health)
        playerData.health = Math.max(
          0,
          Math.min(player.maxHealth, player.health + effects.health)
        );
      if (effects.energy)
        playerData.energy = clamp(player.energy + effects.energy);
      if (effects.sanity)
        playerData.sanity = clamp(player.sanity + effects.sanity);
      if (effects.hunger)
        playerData.hunger = clamp(player.hunger - effects.hunger);
      if (effects.thirst)
        playerData.thirst = clamp(player.thirst - effects.thirst);
      if (effects.fatigue)
        playerData.fatigue = clamp(player.fatigue - effects.fatigue);

      if (Object.keys(playerData).length > 0) {
        await tx.player.update({
          where: { id: player.id },
          data: playerData,
        });
      }

      if (effects.fuel && player.vehicle) {
        await tx.vehicle.update({
          where: { id: player.vehicle.id },
          data: {
            fuel: Math.min(MAX_FUEL, player.vehicle.fuel + effects.fuel),
          },
        });
      }
      if (effects.armor && player.vehicle) {
        await tx.vehicle.update({
          where: { id: player.vehicle.id },
          data: {
            armor: Math.min(MAX_ARMOR, player.vehicle.armor + effects.armor),
          },
        });
      }

      await logNarrative(
        tx,
        player.id,
        `You use ${item.baseItemId}. ${describeEffects(effects)}`,
        'ITEM_USED'
      );
    });

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Use item failed:', error);
    return {
      error: error instanceof Error ? error.message : 'Failed to use item',
    };
  }
}

export async function dropItem(instanceId: string) {
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
  if (item.equipSlot) return { error: 'Unequip it first' };

  try {
    await prisma.$transaction(async (tx) => {
      await tx.playerInventory.delete({ where: { instanceId } });
      await logNarrative(
        tx,
        player.id,
        `You leave the ${item.baseItemId} on the shoulder of the road.`,
        'ITEM_DROPPED'
      );
    });

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Drop item failed:', error);
    return { error: 'Failed to drop item' };
  }
}

function describeEffects(
  effects: NonNullable<(typeof ITEMS)[string]['effects']>
) {
  const parts: string[] = [];
  if (effects.health)
    parts.push(`${effects.health > 0 ? '+' : ''}${effects.health} HP`);
  if (effects.energy) parts.push(`+${effects.energy} energy`);
  if (effects.hunger) parts.push(`-${effects.hunger} hunger`);
  if (effects.thirst) parts.push(`-${effects.thirst} thirst`);
  if (effects.fatigue) parts.push(`-${effects.fatigue} fatigue`);
  if (effects.sanity)
    parts.push(`${effects.sanity > 0 ? '+' : ''}${effects.sanity} sanity`);
  if (effects.fuel) parts.push(`+${effects.fuel} fuel`);
  if (effects.armor) parts.push(`+${effects.armor} vehicle armor`);
  return parts.join(', ') + '.';
}
