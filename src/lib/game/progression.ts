// XP curve and level-up rewards. The old build had an `xp` column that nothing
// ever wrote to, so players were permanently level 1. Everything that costs the
// player a turn now pays XP, and levels hand back real power.

export const MAX_LEVEL = 30;

/** Total XP required to reach `level` from zero. Gentle early, steeper later. */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.round(60 * Math.pow(level - 1, 1.45));
}

export function xpToNextLevel(level: number): number {
  if (level >= MAX_LEVEL) return 0;
  return xpForLevel(level + 1) - xpForLevel(level);
}

/** Progress within the current level, 0..1. */
export function levelProgress(level: number, xp: number): number {
  if (level >= MAX_LEVEL) return 1;
  const floor = xpForLevel(level);
  const span = xpForLevel(level + 1) - floor;
  if (span <= 0) return 1;
  return Math.max(0, Math.min(1, (xp - floor) / span));
}

/** Highest level affordable with `xp` total experience. */
export function levelForXp(xp: number): number {
  let level = 1;
  while (level < MAX_LEVEL && xp >= xpForLevel(level + 1)) level++;
  return level;
}

export interface LevelUpResult {
  newLevel: number;
  levelsGained: number;
  maxHealthGained: number;
  skillPointsGained: number;
  creditsGained: number;
}

export const MAX_HEALTH_PER_LEVEL = 8;
export const SKILL_POINTS_PER_LEVEL = 1;
export const CREDITS_PER_LEVEL = 40;

export function applyLevelUps(
  currentLevel: number,
  totalXp: number
): LevelUpResult | null {
  const newLevel = levelForXp(totalXp);
  if (newLevel <= currentLevel) return null;

  const levelsGained = newLevel - currentLevel;
  return {
    newLevel,
    levelsGained,
    maxHealthGained: levelsGained * MAX_HEALTH_PER_LEVEL,
    skillPointsGained: levelsGained * SKILL_POINTS_PER_LEVEL,
    creditsGained: levelsGained * CREDITS_PER_LEVEL,
  };
}

/** Base unarmed damage; a weapon adds on top of this. Scales with level so a
 * high-level survivor is never helpless after losing their gear. */
export function baseAttackForLevel(level: number): number {
  return 9 + Math.floor(level * 1.6);
}

/** Flat damage reduction from levelling alone (armor adds more). */
export function baseDefenseForLevel(level: number): number {
  return Math.floor(level * 0.4);
}
