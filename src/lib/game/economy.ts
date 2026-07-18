// Defines the base Energy Credit (EC) value for items
export const ITEM_PRICES: Record<string, number> = {
  'Scrap Metal': 10,
  Wood: 5,
  Charcoal: 15,
  'Dirty Water': 2,
  'Clean Water': 25,
  'Small Rations': 20,
  'First Aid Kit': 100,
  'Fuel Canister': 50,

  // Crafted items have a premium
  'Scrap Armor': 150,
  'Improvised Weapon': 75,
  'Water Filter': 60,

  // Vehicle Parts
  'Engine Block': 500,
  Tire: 120,
};

export function getItemPrice(baseItemId: string): number {
  return ITEM_PRICES[baseItemId] || 5; // Default fallback price is 5 EC
}

// ------------------------------------------------------
// SHOP (Trading Post)
// ------------------------------------------------------

export interface ShopItem {
  baseItemId: string;
  description: string;
  category: 'Food & Water' | 'Resources' | 'Supplies';
}

// Traders sell at a markup over the base (sell) value
export const SHOP_MARKUP = 2;

export const SHOP_CATALOG: ShopItem[] = [
  {
    baseItemId: 'Small Rations',
    description: 'A vacuum-sealed meal. Keeps the hunger at bay.',
    category: 'Food & Water',
  },
  {
    baseItemId: 'Clean Water',
    description: 'Purified drinking water. Safe and refreshing.',
    category: 'Food & Water',
  },
  {
    baseItemId: 'Dirty Water',
    description: 'Murky water. Filter it before drinking... or gamble.',
    category: 'Food & Water',
  },
  {
    baseItemId: 'Scrap Metal',
    description: 'Rusty but versatile. The wasteland currency of makers.',
    category: 'Resources',
  },
  {
    baseItemId: 'Wood',
    description: 'Salvaged planks and branches. Burns and builds.',
    category: 'Resources',
  },
  {
    baseItemId: 'Charcoal',
    description: 'Filters water and fuels fires.',
    category: 'Resources',
  },
  {
    baseItemId: 'First Aid Kit',
    description: 'Bandages, antiseptic, painkillers. A lifesaver.',
    category: 'Supplies',
  },
  {
    baseItemId: 'Fuel Canister',
    description: 'Precious gasoline for your vehicle.',
    category: 'Supplies',
  },
];

export function getShopBuyPrice(baseItemId: string): number {
  return getItemPrice(baseItemId) * SHOP_MARKUP;
}

export function getShopItem(baseItemId: string): ShopItem | undefined {
  return SHOP_CATALOG.find((i) => i.baseItemId === baseItemId);
}
