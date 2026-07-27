import { RarityTier } from '@prisma/client';
import { ITEMS, getItemValue } from './items';

/** Sell value of one unit, scaled by rarity. */
export function getItemPrice(baseItemId: string, rarity?: RarityTier): number {
  return getItemValue(baseItemId, rarity);
}

// ------------------------------------------------------
// SHOP (Trading Post — Boone's salvage bay)
// ------------------------------------------------------

export interface ShopItem {
  baseItemId: string;
  description: string;
  category: 'Food & Water' | 'Resources' | 'Supplies' | 'Gear';
  /** Chapter the trader starts stocking this. */
  fromChapter?: number;
}

// Traders sell at a markup over the base (sell) value. 1.6x keeps buying
// viable: the old 2x markup plus tiny combat payouts made the shop a trap.
export const SHOP_MARKUP = 1.6;

export const SHOP_CATALOG: ShopItem[] = [
  {
    baseItemId: 'Small Rations',
    description: 'A vacuum-sealed meal. Keeps the hunger at bay.',
    category: 'Food & Water',
  },
  {
    baseItemId: 'Canned Stew',
    description: 'Pre-collapse beef stew. A genuine morale event.',
    category: 'Food & Water',
    fromChapter: 2,
  },
  {
    baseItemId: 'Clean Water',
    description: 'Purified drinking water. Safe and refreshing.',
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
    baseItemId: 'Cloth',
    description: 'Torn fabric. Padding, bandages, or a decent scarf.',
    category: 'Resources',
  },
  {
    baseItemId: 'Bandage',
    description: 'Stops the bleeding. Barely.',
    category: 'Supplies',
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
  {
    baseItemId: 'Repair Kit',
    description: 'Welding rod and patch plate for vehicle armor.',
    category: 'Supplies',
    fromChapter: 2,
  },
  {
    baseItemId: 'Stimulant',
    description:
      'Burns tomorrow to buy today. Boone sells it, Marlow disapproves.',
    category: 'Supplies',
    fromChapter: 3,
  },
  {
    baseItemId: 'Nail Bat',
    description: 'Classic. Reliable. Deeply unfair.',
    category: 'Gear',
  },
  {
    baseItemId: 'Welder Helm',
    description: 'Scorched visor, dented crown. Still stops a crowbar.',
    category: 'Gear',
  },
  {
    baseItemId: 'Road Greaves',
    description: 'Shin plates cut from a truck door.',
    category: 'Gear',
  },
  {
    baseItemId: 'Scrap Cleaver',
    description: 'A leaf-spring ground to an edge.',
    category: 'Gear',
    fromChapter: 2,
  },
  {
    baseItemId: 'Riot Vest',
    description: 'Looted from a precinct that lost its argument.',
    category: 'Gear',
    fromChapter: 3,
  },
];

export function getShopBuyPrice(baseItemId: string): number {
  return Math.ceil(getItemPrice(baseItemId) * SHOP_MARKUP);
}

export function getShopItem(baseItemId: string): ShopItem | undefined {
  return SHOP_CATALOG.find((i) => i.baseItemId === baseItemId);
}

export function shopCatalogForChapter(chapter: number): ShopItem[] {
  return SHOP_CATALOG.filter((i) => (i.fromChapter ?? 1) <= chapter);
}

/** Kept for callers that only need the raw base value table. */
export const ITEM_PRICES: Record<string, number> = Object.fromEntries(
  Object.values(ITEMS).map((item) => [item.id, item.value])
);
