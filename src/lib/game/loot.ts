import { RarityTier } from '@prisma/client';
import { ITEMS } from './items';
import { pickWeighted, randInt, chance } from './random';

export type LootSource = 'DRIVE' | 'SCAVENGE' | 'CACHE';

interface LootEntry {
  baseItemId: string;
  min: number;
  max: number;
  weight: number;
  /** Earliest zone tier this can appear in. */
  minTier?: number;
}

// The old build dropped Scrap Metal and nothing else, which starved the player
// of food, water and fuel and made the survival stats a pure loss. Every table
// now carries consumables so the loop sustains itself.
const DRIVE_TABLE: LootEntry[] = [
  { baseItemId: 'Scrap Metal', min: 2, max: 5, weight: 26 },
  { baseItemId: 'Fuel Canister', min: 1, max: 1, weight: 16 },
  { baseItemId: 'Clean Water', min: 1, max: 2, weight: 14 },
  { baseItemId: 'Small Rations', min: 1, max: 2, weight: 14 },
  { baseItemId: 'Cloth', min: 1, max: 3, weight: 10 },
  { baseItemId: 'Wood', min: 2, max: 4, weight: 8 },
  { baseItemId: 'First Aid Kit', min: 1, max: 1, weight: 6 },
  { baseItemId: 'Electronics', min: 1, max: 2, weight: 5, minTier: 2 },
  { baseItemId: 'Gun Parts', min: 1, max: 2, weight: 4, minTier: 2 },
  { baseItemId: 'Canned Stew', min: 1, max: 1, weight: 4, minTier: 2 },
  { baseItemId: 'Stimulant', min: 1, max: 1, weight: 3, minTier: 3 },
];

const SCAVENGE_TABLE: LootEntry[] = [
  { baseItemId: 'Scrap Metal', min: 1, max: 4, weight: 28 },
  { baseItemId: 'Wood', min: 1, max: 3, weight: 16 },
  { baseItemId: 'Cloth', min: 1, max: 3, weight: 15 },
  { baseItemId: 'Charcoal', min: 1, max: 2, weight: 12 },
  { baseItemId: 'Dirty Water', min: 1, max: 2, weight: 10 },
  { baseItemId: 'Small Rations', min: 1, max: 1, weight: 9 },
  { baseItemId: 'Bandage', min: 1, max: 2, weight: 7 },
  { baseItemId: 'Electronics', min: 1, max: 1, weight: 5, minTier: 2 },
  { baseItemId: 'Gun Parts', min: 1, max: 1, weight: 3, minTier: 3 },
];

const CACHE_TABLE: LootEntry[] = [
  { baseItemId: 'First Aid Kit', min: 1, max: 2, weight: 18 },
  { baseItemId: 'Fuel Canister', min: 1, max: 2, weight: 18 },
  { baseItemId: 'Canned Stew', min: 1, max: 2, weight: 14 },
  { baseItemId: 'Clean Water', min: 2, max: 3, weight: 14 },
  { baseItemId: 'Repair Kit', min: 1, max: 1, weight: 10 },
  { baseItemId: 'Electronics', min: 2, max: 4, weight: 9 },
  { baseItemId: 'Gun Parts', min: 1, max: 3, weight: 8 },
  { baseItemId: 'Scrap Pistol', min: 1, max: 1, weight: 4, minTier: 2 },
  { baseItemId: 'Riot Vest', min: 1, max: 1, weight: 3, minTier: 3 },
  { baseItemId: 'Convoy Carbine', min: 1, max: 1, weight: 2, minTier: 4 },
];

const TABLES: Record<LootSource, LootEntry[]> = {
  DRIVE: DRIVE_TABLE,
  SCAVENGE: SCAVENGE_TABLE,
  CACHE: CACHE_TABLE,
};

/** How many distinct stacks a source yields. */
const STACK_COUNT: Record<LootSource, [number, number]> = {
  DRIVE: [1, 2],
  SCAVENGE: [1, 2],
  CACHE: [2, 4],
};

// Gear found in the world can roll above COMMON. Deeper zones tilt the odds.
const GEAR_RARITY_WEIGHTS: [RarityTier, number][] = [
  ['COMMON', 55],
  ['UNCOMMON', 24],
  ['SILVER', 12],
  ['GOLD', 6],
  ['ORANGE', 2.2],
  ['PURPLE', 0.6],
  ['BLACK', 0.15],
  ['RED', 0.04],
  ['MYTHICAL', 0.01],
];

export function rollGearRarity(tier: number): RarityTier {
  // Each zone tier past the first shifts weight toward the rarer end.
  const bias = Math.max(0, tier - 1);
  const entries = GEAR_RARITY_WEIGHTS.map(([rarity, weight], index) => ({
    value: rarity,
    weight: weight * Math.pow(1 + bias * 0.35, index),
  }));
  return pickWeighted(entries);
}

export interface RolledLoot {
  baseItemId: string;
  quantity: number;
  rarity: RarityTier;
}

export function rollLoot(source: LootSource, tier: number): RolledLoot[] {
  const table = TABLES[source].filter((e) => (e.minTier ?? 1) <= tier);
  const [minStacks, maxStacks] = STACK_COUNT[source];
  const stacks = randInt(minStacks, maxStacks);

  const results = new Map<string, RolledLoot>();
  for (let i = 0; i < stacks; i++) {
    const entry = pickWeighted(
      table.map((e) => ({ value: e, weight: e.weight }))
    );
    const quantity = randInt(entry.min, entry.max);
    const def = ITEMS[entry.baseItemId];
    const isGear = def?.category === 'WEAPON' || def?.category === 'ARMOR';
    const rarity: RarityTier = isGear ? rollGearRarity(tier) : 'COMMON';

    // Gear instances never merge; resources of the same rarity stack.
    const key = isGear
      ? `${entry.baseItemId}:${i}`
      : `${entry.baseItemId}:${rarity}`;
    const existing = results.get(key);
    if (existing) {
      existing.quantity += quantity;
    } else {
      results.set(key, { baseItemId: entry.baseItemId, quantity, rarity });
    }
  }

  return [...results.values()];
}

/** Small chance any drive turns up a sealed roadside cache. */
export function rollCacheFound(tier: number): boolean {
  return chance(0.08 + tier * 0.01);
}
