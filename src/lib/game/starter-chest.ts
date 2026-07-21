import { Prisma, RarityTier } from '@prisma/client';

// Weighted roll for the quality of the beginner treasure chest.
// Everyone gets a chest; a lucky few start with something special.
const CHEST_RARITY_WEIGHTS: [RarityTier, number][] = [
  ['COMMON', 40],
  ['UNCOMMON', 25],
  ['SILVER', 15],
  ['GOLD', 10],
  ['ORANGE', 5],
  ['PURPLE', 3],
  ['BLACK', 1.5],
  ['RED', 0.4],
  ['MYTHICAL', 0.1],
];

export const STARTER_CREDITS = 50;

export function rollChestRarity(): RarityTier {
  const total = CHEST_RARITY_WEIGHTS.reduce((sum, [, w]) => sum + w, 0);
  let roll = Math.random() * total;
  for (const [rarity, weight] of CHEST_RARITY_WEIGHTS) {
    roll -= weight;
    if (roll <= 0) return rarity;
  }
  return 'COMMON';
}

/**
 * Grants the beginner treasure chest inside an existing transaction:
 * a weapon of the chest's rolled quality, basic survival supplies,
 * and some starting EC.
 */
export async function grantStarterChest(
  tx: Prisma.TransactionClient,
  playerId: string
): Promise<RarityTier> {
  const chestRarity = rollChestRarity();

  // Weapon of the chest's quality, auto-equipped so it isn't dead weight
  await tx.playerInventory.create({
    data: {
      playerId,
      baseItemId: 'Improvised Weapon',
      rarity: chestRarity,
      quantity: 1,
      equipSlot: 'WEAPON',
    },
  });

  // Survival supplies
  const supplies: { baseItemId: string; quantity: number }[] = [
    { baseItemId: 'Scrap Metal', quantity: 5 },
    { baseItemId: 'Small Rations', quantity: 2 },
    { baseItemId: 'Clean Water', quantity: 2 },
    { baseItemId: 'First Aid Kit', quantity: 1 },
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

  // Starting credits
  await tx.player.update({
    where: { id: playerId },
    data: { credits: { increment: STARTER_CREDITS } },
  });

  await tx.eventLog.create({
    data: {
      playerId,
      eventType: 'SYSTEM_NARRATIVE',
      payload: {
        text: `You crack open a Beginner Treasure Chest... it glimmers with ${chestRarity} quality! Inside: a ${chestRarity} Improvised Weapon, 5 Scrap Metal, 2 Small Rations, 2 Clean Water, a First Aid Kit, and ${STARTER_CREDITS} EC.`,
      },
    },
  });

  return chestRarity;
}
