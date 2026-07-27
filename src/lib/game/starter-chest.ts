import { Prisma, RarityTier } from '@prisma/client';
import { pickWeighted, pickOne } from './random';

// Weighted roll for the quality of the beginner treasure chest. Everyone gets
// a chest; a lucky few start with something the road will remember.
const CHEST_RARITY_WEIGHTS: [RarityTier, number][] = [
  ['COMMON', 30],
  ['UNCOMMON', 28],
  ['SILVER', 20],
  ['GOLD', 12],
  ['ORANGE', 6],
  ['PURPLE', 2.5],
  ['BLACK', 1],
  ['RED', 0.4],
  ['MYTHICAL', 0.1],
];

export const STARTER_CREDITS = 220;

const STARTER_WEAPONS = ['Improvised Weapon', 'Nail Bat', 'Scrap Cleaver'];

export function rollChestRarity(): RarityTier {
  return pickWeighted(
    CHEST_RARITY_WEIGHTS.map(([value, weight]) => ({ value, weight }))
  );
}

/**
 * Grants the beginner treasure chest inside an existing transaction: a weapon
 * and a chest piece of the rolled quality, enough supplies to survive the
 * first stretch, and starting EC. Generous on purpose — the opening should
 * feel like the player is the protagonist, not a scavenger with a rock.
 */
export async function grantStarterChest(
  tx: Prisma.TransactionClient,
  playerId: string
): Promise<RarityTier> {
  const chestRarity = rollChestRarity();
  const weaponId = pickOne(STARTER_WEAPONS);

  // Weapon of the chest's quality, auto-equipped so it isn't dead weight
  await tx.playerInventory.create({
    data: {
      playerId,
      baseItemId: weaponId,
      rarity: chestRarity,
      quantity: 1,
      equipSlot: 'WEAPON',
    },
  });

  // Matching armor so the opening fights are survivable
  await tx.playerInventory.create({
    data: {
      playerId,
      baseItemId: 'Scrap Armor',
      rarity: chestRarity,
      quantity: 1,
      equipSlot: 'CHEST',
    },
  });

  const supplies: { baseItemId: string; quantity: number }[] = [
    { baseItemId: 'Scrap Metal', quantity: 10 },
    { baseItemId: 'Wood', quantity: 5 },
    { baseItemId: 'Cloth', quantity: 5 },
    { baseItemId: 'Charcoal', quantity: 4 },
    { baseItemId: 'Small Rations', quantity: 4 },
    { baseItemId: 'Clean Water', quantity: 4 },
    { baseItemId: 'First Aid Kit', quantity: 2 },
    { baseItemId: 'Fuel Canister', quantity: 2 },
  ];

  for (const supply of supplies) {
    await tx.playerInventory.create({
      data: {
        playerId,
        baseItemId: supply.baseItemId,
        quantity: supply.quantity,
      },
    });
  }

  await tx.player.update({
    where: { id: playerId },
    data: { credits: { increment: STARTER_CREDITS } },
  });

  await tx.eventLog.create({
    data: {
      playerId,
      eventType: 'SYSTEM_NARRATIVE',
      payload: {
        text: `Bolted under the driver's seat you find a sealed crate — somebody packed this for you. It cracks open ${chestRarity} bright: a ${chestRarity} ${weaponId}, ${chestRarity} Scrap Armor, a full run of supplies, and ${STARTER_CREDITS} EC. Whoever they were, they meant for you to make it.`,
      },
    },
  });

  return chestRarity;
}
