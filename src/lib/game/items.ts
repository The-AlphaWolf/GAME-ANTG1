import { RarityTier } from '@prisma/client';
import { getRarityMultiplier } from './rarity';

export type ItemCategory =
  | 'RESOURCE'
  | 'FOOD'
  | 'WATER'
  | 'MEDICAL'
  | 'FUEL'
  | 'WEAPON'
  | 'ARMOR'
  | 'RELIC';

export type EquipSlot = 'WEAPON' | 'HEAD' | 'CHEST' | 'LEGS';

/** What consuming one unit of an item does. Positive numbers restore the
 * stat the player wants high (health/energy/sanity) or reduce the ones they
 * want low (hunger/thirst/fatigue). `fuel` tops up the vehicle instead. */
export interface ItemEffects {
  health?: number;
  energy?: number;
  sanity?: number;
  hunger?: number; // amount removed
  thirst?: number; // amount removed
  fatigue?: number; // amount removed
  fuel?: number;
  armor?: number; // vehicle armor patched
}

export interface ItemDef {
  id: string;
  name: string;
  category: ItemCategory;
  description: string;
  /** Base sell value in EC before rarity scaling. */
  value: number;
  /** Set for gear. Weapons add damage, armor reduces incoming damage. */
  slot?: EquipSlot;
  damage?: number;
  defense?: number;
  effects?: ItemEffects;
}

export const ITEMS: Record<string, ItemDef> = {
  // ---------------- Resources ----------------
  'Scrap Metal': {
    id: 'Scrap Metal',
    name: 'Scrap Metal',
    category: 'RESOURCE',
    description:
      'Rusted plate and rebar. The wasteland builds everything twice.',
    value: 10,
  },
  Wood: {
    id: 'Wood',
    name: 'Wood',
    category: 'RESOURCE',
    description: 'Salvaged planks. Burns, braces, and beats.',
    value: 8,
  },
  Charcoal: {
    id: 'Charcoal',
    name: 'Charcoal',
    category: 'RESOURCE',
    description: 'Filters water, starts fires, hides a scent.',
    value: 14,
  },
  Cloth: {
    id: 'Cloth',
    name: 'Cloth',
    category: 'RESOURCE',
    description: 'Torn fabric stripped from seats and corpses alike.',
    value: 9,
  },
  Electronics: {
    id: 'Electronics',
    name: 'Electronics',
    category: 'RESOURCE',
    description: 'Boards and copper pulled from dead dashboards.',
    value: 35,
  },
  'Gun Parts': {
    id: 'Gun Parts',
    name: 'Gun Parts',
    category: 'RESOURCE',
    description: 'Springs, pins and a bent barrel. Half a weapon.',
    value: 45,
  },

  // ---------------- Consumables ----------------
  'Small Rations': {
    id: 'Small Rations',
    name: 'Small Rations',
    category: 'FOOD',
    description:
      'A vacuum-sealed meal. Tastes like cardboard, works like a meal.',
    value: 18,
    effects: { hunger: 35, energy: 5 },
  },
  'Canned Stew': {
    id: 'Canned Stew',
    name: 'Canned Stew',
    category: 'FOOD',
    description: 'Pre-collapse beef stew. A genuine morale event.',
    value: 40,
    effects: { hunger: 60, energy: 10, sanity: 8 },
  },
  'Clean Water': {
    id: 'Clean Water',
    name: 'Clean Water',
    category: 'WATER',
    description: 'Purified and sealed. Worth more than fuel some days.',
    value: 20,
    effects: { thirst: 40 },
  },
  'Dirty Water': {
    id: 'Dirty Water',
    name: 'Dirty Water',
    category: 'WATER',
    description: 'Silty runoff. Drink it and gamble, or filter it first.',
    value: 4,
    effects: { thirst: 25, health: -8 },
  },
  'First Aid Kit': {
    id: 'First Aid Kit',
    name: 'First Aid Kit',
    category: 'MEDICAL',
    description: 'Gauze, antiseptic, painkillers. The real currency out here.',
    value: 70,
    effects: { health: 55 },
  },
  Bandage: {
    id: 'Bandage',
    name: 'Bandage',
    category: 'MEDICAL',
    description: 'Stops the bleeding. Barely.',
    value: 20,
    effects: { health: 20 },
  },
  Stimulant: {
    id: 'Stimulant',
    name: 'Stimulant',
    category: 'MEDICAL',
    description: 'Military-grade go-pills. Burns tomorrow to buy today.',
    value: 55,
    effects: { energy: 60, fatigue: 40, sanity: -6 },
  },
  'Fuel Canister': {
    id: 'Fuel Canister',
    name: 'Fuel Canister',
    category: 'FUEL',
    description: 'Twenty litres of siphoned gasoline.',
    value: 45,
    effects: { fuel: 40 },
  },
  'Repair Kit': {
    id: 'Repair Kit',
    name: 'Repair Kit',
    category: 'RESOURCE',
    description: 'Welding rod, patch plate, and a prayer.',
    value: 60,
    effects: { armor: 35 },
  },

  // ---------------- Weapons ----------------
  'Improvised Weapon': {
    id: 'Improvised Weapon',
    name: 'Improvised Weapon',
    category: 'WEAPON',
    description: 'A pipe wrapped in wire. Ugly, honest, effective.',
    value: 60,
    slot: 'WEAPON',
    damage: 8,
  },
  'Scrap Cleaver': {
    id: 'Scrap Cleaver',
    name: 'Scrap Cleaver',
    category: 'WEAPON',
    description:
      'A leaf-spring ground to an edge. Heavy swing, heavier result.',
    value: 140,
    slot: 'WEAPON',
    damage: 15,
  },
  'Nail Bat': {
    id: 'Nail Bat',
    name: 'Nail Bat',
    category: 'WEAPON',
    description: 'Classic. Reliable. Deeply unfair.',
    value: 110,
    slot: 'WEAPON',
    damage: 12,
  },
  'Scrap Pistol': {
    id: 'Scrap Pistol',
    name: 'Scrap Pistol',
    category: 'WEAPON',
    description: 'Hand-machined and slightly terrifying to fire.',
    value: 260,
    slot: 'WEAPON',
    damage: 22,
  },
  'Convoy Carbine': {
    id: 'Convoy Carbine',
    name: 'Convoy Carbine',
    category: 'WEAPON',
    description:
      'Issued to Convoy outriders. You are not supposed to have this.',
    value: 480,
    slot: 'WEAPON',
    damage: 32,
  },

  // ---------------- Armor ----------------
  'Scrap Armor': {
    id: 'Scrap Armor',
    name: 'Scrap Armor',
    category: 'ARMOR',
    description: 'Welded plate over a road-worn jacket.',
    value: 130,
    slot: 'CHEST',
    defense: 4,
  },
  'Riot Vest': {
    id: 'Riot Vest',
    name: 'Riot Vest',
    category: 'ARMOR',
    description: 'Looted from a precinct that lost its argument.',
    value: 300,
    slot: 'CHEST',
    defense: 9,
  },
  'Welder Helm': {
    id: 'Welder Helm',
    name: 'Welder Helm',
    category: 'ARMOR',
    description: 'Scorched visor, dented crown. Still stops a crowbar.',
    value: 120,
    slot: 'HEAD',
    defense: 3,
  },
  'Road Greaves': {
    id: 'Road Greaves',
    name: 'Road Greaves',
    category: 'ARMOR',
    description: 'Shin plates cut from a truck door.',
    value: 110,
    slot: 'LEGS',
    defense: 3,
  },

  // ---------------- Story ----------------
  'Water Filter': {
    id: 'Water Filter',
    name: 'Water Filter',
    category: 'RESOURCE',
    description: 'Charcoal and cloth in a scrap housing. Turns silt into life.',
    value: 55,
  },
  'Convoy Keycard': {
    id: 'Convoy Keycard',
    name: 'Convoy Keycard',
    category: 'RELIC',
    description: 'Black polymer, no markings. Opens something that matters.',
    value: 0,
  },
  'Rusted Locket': {
    id: 'Rusted Locket',
    name: 'Rusted Locket',
    category: 'RELIC',
    description: "A stranger's family, frozen mid-laugh. You keep it anyway.",
    value: 25,
  },
};

export function getItem(baseItemId: string): ItemDef | undefined {
  return ITEMS[baseItemId];
}

export function getItemValue(baseItemId: string, rarity?: RarityTier): number {
  const base = ITEMS[baseItemId]?.value ?? 5;
  return rarity ? Math.floor(base * getRarityMultiplier(rarity)) : base;
}

export function isConsumable(baseItemId: string): boolean {
  return !!ITEMS[baseItemId]?.effects;
}

export function getEquipSlot(baseItemId: string): EquipSlot | undefined {
  return ITEMS[baseItemId]?.slot;
}

/** Weapon damage after rarity scaling. Rarity multipliers are steep, so
 * weapon damage uses a softened curve to keep upgrades exciting but not
 * instantly trivialising every encounter. */
export function getWeaponDamage(
  baseItemId: string,
  rarity: RarityTier = 'COMMON'
): number {
  const base = ITEMS[baseItemId]?.damage ?? 0;
  if (!base) return 0;
  return Math.round(base * (1 + (getRarityMultiplier(rarity) - 1) * 0.55));
}

export function getArmorDefense(
  baseItemId: string,
  rarity: RarityTier = 'COMMON'
): number {
  const base = ITEMS[baseItemId]?.defense ?? 0;
  if (!base) return 0;
  return Math.round(base * (1 + (getRarityMultiplier(rarity) - 1) * 0.45));
}
