import { RarityTier } from '@prisma/client';
import { RARITY_ORDER, getNextRarity } from './rarity';
import { chance } from './random';

export const DAILY_CHARGES = 6;

/**
 * The old talent set `isUpgraded = true` and refused to ever touch an item
 * again, so six daily charges could be spent on the five items a player owned
 * and then the signature mechanic was over forever. Items are now upgradeable
 * repeatedly; the cost is what climbs.
 */
export function chargeCostFor(rarity: RarityTier): number {
  const index = RARITY_ORDER.indexOf(rarity);
  if (index < 0) return 1;
  if (index <= 1) return 1; // COMMON, UNCOMMON
  if (index <= 3) return 2; // SILVER, GOLD
  if (index <= 5) return 3; // ORANGE, PURPLE
  return 4; // BLACK, RED
}

/** EC cost scales steeply so late-tier pushes are a real decision. */
export function creditCostFor(rarity: RarityTier): number {
  const index = RARITY_ORDER.indexOf(rarity);
  return Math.round(40 * Math.pow(2.05, Math.max(0, index)));
}

export function isMaxRarity(rarity: RarityTier): boolean {
  return rarity === 'MYTHICAL';
}

export interface UpgradeRoll {
  finalRarity: RarityTier;
  tiersGained: number;
  jackpot: boolean;
}

const SECONDARY_ODDS = 0.3;
const TERTIARY_ODDS = 0.08;
const JACKPOT_ODDS = 0.0008;

export function rollUpgrade(current: RarityTier): UpgradeRoll {
  if (chance(JACKPOT_ODDS)) {
    return {
      finalRarity: 'MYTHICAL',
      tiersGained:
        RARITY_ORDER.indexOf('MYTHICAL') - RARITY_ORDER.indexOf(current),
      jackpot: true,
    };
  }

  let finalRarity = getNextRarity(current)!;
  let tiersGained = 1;

  if (finalRarity !== 'MYTHICAL' && chance(SECONDARY_ODDS)) {
    finalRarity = getNextRarity(finalRarity)!;
    tiersGained++;

    if (finalRarity !== 'MYTHICAL' && chance(TERTIARY_ODDS)) {
      finalRarity = getNextRarity(finalRarity)!;
      tiersGained++;
    }
  }

  return { finalRarity, tiersGained, jackpot: false };
}
