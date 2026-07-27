import { RarityTier } from '@prisma/client';
import { pickWeighted, randInt, chance } from './random';

export interface EnemyDrop {
  baseItemId: string;
  min: number;
  max: number;
  /** Probability this drop appears at all, 0..1. */
  odds: number;
  rarity?: RarityTier;
}

export interface EnemyDef {
  id: string;
  name: string;
  /** Which story zone tier (1-4) this enemy belongs to. */
  tier: number;
  description: string;
  baseHp: number;
  hpVariance: number;
  baseAttack: number;
  /** Flat damage this enemy shrugs off. */
  armor: number;
  xp: number;
  credits: [number, number];
  drops: EnemyDrop[];
  /** Higher = more likely to appear in its tier. */
  weight: number;
}

// Difficulty note: player base attack at level 1 is ~10 and a COMMON
// Improvised Weapon adds 8, so ~18/turn. Tier-1 enemies sit at 22-34 HP so a
// starting fight is two to three turns and costs a survivable amount of HP.
export const ENEMIES: EnemyDef[] = [
  // ---------------- Tier 1: the easy stretch ----------------
  {
    id: 'stray_dog',
    name: 'Stray Dog Pack',
    tier: 1,
    description: 'Ribs showing, teeth showing more.',
    baseHp: 22,
    hpVariance: 6,
    baseAttack: 4,
    armor: 0,
    xp: 18,
    credits: [8, 18],
    weight: 30,
    drops: [{ baseItemId: 'Cloth', min: 1, max: 2, odds: 0.5 }],
  },
  {
    id: 'feral_scavenger',
    name: 'Feral Scavenger',
    tier: 1,
    description: 'A survivor who stopped being one a while ago.',
    baseHp: 26,
    hpVariance: 8,
    baseAttack: 5,
    armor: 0,
    xp: 24,
    credits: [12, 26],
    weight: 35,
    drops: [
      { baseItemId: 'Scrap Metal', min: 1, max: 3, odds: 0.7 },
      { baseItemId: 'Small Rations', min: 1, max: 1, odds: 0.3 },
    ],
  },
  {
    id: 'highway_raider',
    name: 'Highway Raider',
    tier: 1,
    description: 'Bandana, crowbar, bad intentions.',
    baseHp: 30,
    hpVariance: 8,
    baseAttack: 6,
    armor: 1,
    xp: 30,
    credits: [18, 34],
    weight: 30,
    drops: [
      { baseItemId: 'Scrap Metal', min: 2, max: 4, odds: 0.6 },
      { baseItemId: 'Improvised Weapon', min: 1, max: 1, odds: 0.15 },
      { baseItemId: 'Clean Water', min: 1, max: 1, odds: 0.25 },
    ],
  },

  // ---------------- Tier 2: The Dust Corridor ----------------
  {
    id: 'dust_stalker',
    name: 'Dust Stalker',
    tier: 2,
    description:
      'Wrapped head to boot in rags, moves like the wind decided to hunt.',
    baseHp: 44,
    hpVariance: 10,
    baseAttack: 9,
    armor: 2,
    xp: 55,
    credits: [30, 55],
    weight: 35,
    drops: [
      { baseItemId: 'Cloth', min: 2, max: 4, odds: 0.6 },
      { baseItemId: 'Charcoal', min: 1, max: 2, odds: 0.4 },
      { baseItemId: 'Nail Bat', min: 1, max: 1, odds: 0.12 },
    ],
  },
  {
    id: 'rust_hound',
    name: 'Rust Hound',
    tier: 2,
    description: 'Something between a dog and a machine, and angry about both.',
    baseHp: 50,
    hpVariance: 12,
    baseAttack: 10,
    armor: 3,
    xp: 62,
    credits: [34, 62],
    weight: 30,
    drops: [
      { baseItemId: 'Scrap Metal', min: 3, max: 6, odds: 0.75 },
      { baseItemId: 'Electronics', min: 1, max: 2, odds: 0.35 },
    ],
  },
  {
    id: 'corridor_toll_gang',
    name: 'Corridor Toll Gang',
    tier: 2,
    description: 'They call it a toll. It is not a toll.',
    baseHp: 58,
    hpVariance: 14,
    baseAttack: 11,
    armor: 3,
    xp: 75,
    credits: [50, 90],
    weight: 25,
    drops: [
      { baseItemId: 'Gun Parts', min: 1, max: 2, odds: 0.4 },
      { baseItemId: 'Fuel Canister', min: 1, max: 1, odds: 0.3 },
      { baseItemId: 'Scrap Cleaver', min: 1, max: 1, odds: 0.12 },
    ],
  },

  // ---------------- Tier 3: Broken Interstates ----------------
  {
    id: 'sinkhole_lurker',
    name: 'Sinkhole Lurker',
    tier: 3,
    description: 'It has been down there long enough to stop needing eyes.',
    baseHp: 78,
    hpVariance: 18,
    baseAttack: 16,
    armor: 5,
    xp: 120,
    credits: [70, 120],
    weight: 32,
    drops: [
      { baseItemId: 'Electronics', min: 2, max: 4, odds: 0.5 },
      { baseItemId: 'Rusted Locket', min: 1, max: 1, odds: 0.2 },
    ],
  },
  {
    id: 'convoy_outrider',
    name: 'Convoy Outrider',
    tier: 3,
    description: 'Clean uniform. Cleaner rifle. Works for Vane.',
    baseHp: 88,
    hpVariance: 18,
    baseAttack: 18,
    armor: 7,
    xp: 150,
    credits: [100, 175],
    weight: 30,
    drops: [
      { baseItemId: 'Gun Parts', min: 2, max: 3, odds: 0.55 },
      { baseItemId: 'Riot Vest', min: 1, max: 1, odds: 0.12 },
      { baseItemId: 'First Aid Kit', min: 1, max: 1, odds: 0.35 },
    ],
  },
  {
    id: 'ash_revenant',
    name: 'Ash Revenant',
    tier: 3,
    description: 'Burned, walking, and apparently unbothered by either.',
    baseHp: 95,
    hpVariance: 20,
    baseAttack: 19,
    armor: 6,
    xp: 165,
    credits: [90, 160],
    weight: 22,
    drops: [
      { baseItemId: 'Charcoal', min: 3, max: 6, odds: 0.7 },
      { baseItemId: 'Stimulant', min: 1, max: 1, odds: 0.3 },
    ],
  },

  // ---------------- Tier 4: Black Ridge ----------------
  {
    id: 'ridge_enforcer',
    name: 'Ridge Enforcer',
    tier: 4,
    description: 'Plated, patient, and paid very well.',
    baseHp: 130,
    hpVariance: 25,
    baseAttack: 26,
    armor: 11,
    xp: 260,
    credits: [180, 300],
    weight: 34,
    drops: [
      { baseItemId: 'Convoy Carbine', min: 1, max: 1, odds: 0.12 },
      { baseItemId: 'Gun Parts', min: 3, max: 5, odds: 0.6 },
      { baseItemId: 'First Aid Kit', min: 1, max: 2, odds: 0.45 },
    ],
  },
  {
    id: 'slag_walker',
    name: 'Slag Walker',
    tier: 4,
    description: 'Whatever burned Black Ridge is still inside it, walking.',
    baseHp: 150,
    hpVariance: 30,
    baseAttack: 29,
    armor: 13,
    xp: 300,
    credits: [200, 340],
    weight: 30,
    drops: [
      { baseItemId: 'Electronics', min: 3, max: 6, odds: 0.6 },
      { baseItemId: 'Repair Kit', min: 1, max: 2, odds: 0.4 },
    ],
  },
];

export function getEnemiesForTier(tier: number): EnemyDef[] {
  const clamped = Math.max(1, Math.min(4, tier));
  const pool = ENEMIES.filter((e) => e.tier === clamped);
  return pool.length > 0 ? pool : ENEMIES.filter((e) => e.tier === 1);
}

export function rollEnemyForTier(tier: number): EnemyDef {
  const pool = getEnemiesForTier(tier);
  return pickWeighted(pool.map((e) => ({ value: e, weight: e.weight })));
}

export function getEnemyByName(name: string): EnemyDef | undefined {
  return ENEMIES.find((e) => e.name === name);
}

export interface RolledEnemy {
  def: EnemyDef;
  hp: number;
  attack: number;
}

/** Instantiate an enemy, nudged by player level so a fight stays meaningful
 * without ever outrunning the player's own power curve. */
export function instantiateEnemy(
  def: EnemyDef,
  playerLevel: number
): RolledEnemy {
  const levelStep = Math.max(0, playerLevel - 1);
  return {
    def,
    hp: Math.round(
      def.baseHp + randInt(0, def.hpVariance) + levelStep * (def.tier * 0.9)
    ),
    attack: Math.round(def.baseAttack + levelStep * (def.tier * 0.25)),
  };
}

export interface RolledDrop {
  baseItemId: string;
  quantity: number;
  rarity: RarityTier;
}

export function rollEnemyDrops(def: EnemyDef): RolledDrop[] {
  const drops: RolledDrop[] = [];
  for (const drop of def.drops) {
    if (!chance(drop.odds)) continue;
    drops.push({
      baseItemId: drop.baseItemId,
      quantity: randInt(drop.min, drop.max),
      rarity: drop.rarity ?? 'COMMON',
    });
  }
  return drops;
}

export function rollEnemyCredits(def: EnemyDef): number {
  return randInt(def.credits[0], def.credits[1]);
}
