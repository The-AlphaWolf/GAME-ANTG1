import { RarityTier } from '@prisma/client';

export const RARITY_ORDER: RarityTier[] = [
  'COMMON',
  'UNCOMMON',
  'SILVER',
  'GOLD',
  'ORANGE',
  'PURPLE',
  'BLACK',
  'RED',
  'MYTHICAL',
];

export const RARITY_MULTIPLIERS: Record<RarityTier, number> = {
  COMMON: 1.0,
  UNCOMMON: 1.2,
  SILVER: 1.5,
  GOLD: 2.0,
  ORANGE: 3.0,
  PURPLE: 5.0,
  BLACK: 8.0,
  RED: 15.0,
  MYTHICAL: 50.0,
};

export const RARITY_COLORS: Record<RarityTier, string> = {
  COMMON: 'text-zinc-400 border-zinc-700',
  UNCOMMON: 'text-green-500 border-green-800',
  SILVER: 'text-slate-300 border-slate-500',
  GOLD: 'text-yellow-400 border-yellow-600',
  ORANGE: 'text-orange-500 border-orange-700',
  PURPLE: 'text-purple-500 border-purple-800',
  BLACK: 'text-zinc-900 border-zinc-950 shadow-[0_0_15px_rgba(0,0,0,0.8)]', // Vantablack look
  RED: 'text-red-600 border-red-900 shadow-[0_0_15px_rgba(220,38,38,0.5)]',
  MYTHICAL:
    'text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-500 to-purple-500 border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.5)]',
};

export const RARITY_BG_COLORS: Record<RarityTier, string> = {
  COMMON: 'bg-zinc-800/50',
  UNCOMMON: 'bg-green-900/30',
  SILVER: 'bg-slate-800/50',
  GOLD: 'bg-yellow-900/30',
  ORANGE: 'bg-orange-900/30',
  PURPLE: 'bg-purple-900/30',
  BLACK: 'bg-zinc-950',
  RED: 'bg-red-950/50',
  MYTHICAL:
    'bg-gradient-to-br from-purple-900/40 via-red-900/40 to-yellow-900/40',
};

export function getNextRarity(current: RarityTier): RarityTier | null {
  const currentIndex = RARITY_ORDER.indexOf(current);
  if (currentIndex === -1 || currentIndex === RARITY_ORDER.length - 1) {
    return null;
  }
  return RARITY_ORDER[currentIndex + 1];
}

export function getRarityMultiplier(rarity: RarityTier): number {
  return RARITY_MULTIPLIERS[rarity] || 1.0;
}
