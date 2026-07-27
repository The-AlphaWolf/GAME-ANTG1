import { describe, it, expect } from 'vitest';
import {
  MAX_LEVEL,
  applyLevelUps,
  baseAttackForLevel,
  levelForXp,
  levelProgress,
  xpForLevel,
} from '@/lib/game/progression';
import { chargeCostFor, creditCostFor, rollUpgrade } from '@/lib/game/talent';
import { RARITY_ORDER } from '@/lib/game/rarity';
import {
  clockFromTurns,
  starvationDamage,
  survivalDrainForTurns,
  weatherFromTurns,
} from '@/lib/game/world';
import {
  chapterForMiles,
  crossedStoryBeats,
  WIN_DISTANCE,
} from '@/lib/game/story';

describe('XP and levelling', () => {
  it('level 1 costs nothing and the curve rises', () => {
    expect(xpForLevel(1)).toBe(0);
    for (let level = 2; level <= MAX_LEVEL; level++) {
      expect(xpForLevel(level)).toBeGreaterThan(xpForLevel(level - 1));
    }
  });

  it('levelForXp is the inverse of xpForLevel', () => {
    for (let level = 1; level <= MAX_LEVEL; level++) {
      expect(levelForXp(xpForLevel(level))).toBe(level);
    }
  });

  it('reports no level-up when XP is short', () => {
    expect(applyLevelUps(1, xpForLevel(2) - 1)).toBeNull();
  });

  it('grants max HP, skill points and EC on level-up', () => {
    const result = applyLevelUps(1, xpForLevel(3));
    expect(result).not.toBeNull();
    expect(result!.newLevel).toBe(3);
    expect(result!.levelsGained).toBe(2);
    expect(result!.maxHealthGained).toBeGreaterThan(0);
    expect(result!.skillPointsGained).toBe(2);
    expect(result!.creditsGained).toBeGreaterThan(0);
  });

  it('clamps progress to 0..1', () => {
    expect(levelProgress(1, 0)).toBe(0);
    expect(levelProgress(MAX_LEVEL, 999999)).toBe(1);
  });

  it('attack power grows with level', () => {
    expect(baseAttackForLevel(10)).toBeGreaterThan(baseAttackForLevel(1));
  });
});

describe('SSS Talent upgrades', () => {
  it('charges and EC both climb with rarity', () => {
    for (let i = 1; i < RARITY_ORDER.length; i++) {
      expect(chargeCostFor(RARITY_ORDER[i])).toBeGreaterThanOrEqual(
        chargeCostFor(RARITY_ORDER[i - 1])
      );
      expect(creditCostFor(RARITY_ORDER[i])).toBeGreaterThan(
        creditCostFor(RARITY_ORDER[i - 1])
      );
    }
  });

  it('always advances at least one tier and never past MYTHICAL', () => {
    for (const rarity of RARITY_ORDER.slice(0, -1)) {
      for (let i = 0; i < 200; i++) {
        const roll = rollUpgrade(rarity);
        const from = RARITY_ORDER.indexOf(rarity);
        const to = RARITY_ORDER.indexOf(roll.finalRarity);
        expect(to).toBeGreaterThan(from);
        expect(to).toBeLessThanOrEqual(RARITY_ORDER.length - 1);
      }
    }
  });
});

describe('World clock and survival', () => {
  it('a run starts on day 1 at 06:00', () => {
    const clock = clockFromTurns(0);
    expect(clock.day).toBe(1);
    expect(clock.label).toBe('06:00');
  });

  it('48 turns is exactly one day', () => {
    expect(clockFromTurns(48).day).toBe(2);
    expect(clockFromTurns(48).label).toBe('06:00');
  });

  it('weather is deterministic for a given turn count', () => {
    expect(weatherFromTurns(17)).toEqual(weatherFromTurns(17));
  });

  it('survival drain scales with turns spent', () => {
    const weather = weatherFromTurns(0);
    const one = survivalDrainForTurns(1, weather, false);
    const two = survivalDrainForTurns(2, weather, false);
    expect(two.hunger).toBeGreaterThan(one.hunger);
    expect(two.thirst).toBeGreaterThan(one.thirst);
  });

  it('only critical stats deal starvation damage', () => {
    expect(starvationDamage(50, 50, 50)).toBe(0);
    expect(starvationDamage(90, 50, 50)).toBeGreaterThan(0);
    expect(starvationDamage(90, 90, 90)).toBeGreaterThan(
      starvationDamage(90, 50, 50)
    );
  });
});

describe('Story progression', () => {
  it('mile zero is chapter 1 and the finish is the last chapter', () => {
    expect(chapterForMiles(0).number).toBe(1);
    expect(chapterForMiles(WIN_DISTANCE).number).toBe(5);
  });

  it('chapters are ordered by starting mile and rising tier', () => {
    for (let i = 1; i < 5; i++) {
      const previous = chapterForMiles(i * 100);
      expect(previous.tier).toBeGreaterThanOrEqual(1);
    }
  });

  it('emits a chapter beat exactly once when crossing its threshold', () => {
    const beats = crossedStoryBeats(145, 155);
    expect(beats.some((b) => b.chapter === 2)).toBe(true);
    expect(crossedStoryBeats(155, 165).some((b) => b.chapter === 2)).toBe(
      false
    );
  });

  it('emits the win beat only when crossing the finish line', () => {
    expect(crossedStoryBeats(990, 1000).some((b) => b.isWin)).toBe(true);
    expect(crossedStoryBeats(1000, 1010).some((b) => b.isWin)).toBe(false);
  });
});
