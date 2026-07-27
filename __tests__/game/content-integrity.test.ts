import { describe, it, expect } from 'vitest';
import { ITEMS, getWeaponDamage, getArmorDefense } from '@/lib/game/items';
import { ENEMIES, getEnemiesForTier } from '@/lib/game/enemies';
import { ALL_QUESTS } from '@/lib/game/quests';
import { RECIPES } from '@/lib/game/crafting-recipes';
import { SHOP_CATALOG } from '@/lib/game/economy';
import { rollLoot } from '@/lib/game/loot';
import { CHAPTERS } from '@/lib/game/story';
import { NPCS } from '@/lib/game/npcs';

// The previous build shipped quests targeting "Mutated Wolf" and recipes
// requiring Wood, none of which the game could produce. These tests exist so
// that class of dead content cannot ship again.
describe('Content integrity', () => {
  const itemIds = new Set(Object.keys(ITEMS));
  const enemyNames = new Set(ENEMIES.map((e) => e.name));

  it('every quest targets a real enemy, item, or mileage', () => {
    for (const quest of ALL_QUESTS) {
      if (quest.type === 'KILL') {
        expect(enemyNames, `${quest.id} targets a real enemy`).toContain(
          quest.targetId
        );
      } else if (quest.type === 'GATHER') {
        expect(itemIds, `${quest.id} targets a real item`).toContain(
          quest.targetId
        );
      } else {
        expect(quest.targetId).toBe('miles');
      }
    }
  });

  it('every quest reward item exists', () => {
    for (const quest of ALL_QUESTS) {
      for (const reward of quest.rewards.items ?? []) {
        expect(itemIds, `${quest.id} rewards a real item`).toContain(
          reward.itemId
        );
      }
    }
  });

  it('every recipe ingredient and output exists', () => {
    for (const recipe of RECIPES) {
      expect(itemIds).toContain(recipe.outputItemId);
      for (const ingredient of recipe.ingredients) {
        expect(itemIds, `${recipe.id} needs a real item`).toContain(
          ingredient.baseItemId
        );
      }
    }
  });

  it('every enemy drop exists', () => {
    for (const enemy of ENEMIES) {
      for (const drop of enemy.drops) {
        expect(itemIds, `${enemy.id} drops a real item`).toContain(
          drop.baseItemId
        );
      }
    }
  });

  it('every shop entry exists', () => {
    for (const entry of SHOP_CATALOG) {
      expect(itemIds).toContain(entry.baseItemId);
    }
  });

  it('every chapter tier has an enemy pool', () => {
    for (const chapter of CHAPTERS) {
      expect(getEnemiesForTier(chapter.tier).length).toBeGreaterThan(0);
    }
  });

  it('every recipe ingredient is obtainable from loot or the shop', () => {
    const shopStock = new Set(SHOP_CATALOG.map((s) => s.baseItemId));
    const droppable = new Set<string>();

    // Sample the loot tables broadly enough to enumerate what they can yield.
    for (const source of ['DRIVE', 'SCAVENGE', 'CACHE'] as const) {
      for (let tier = 1; tier <= 4; tier++) {
        for (let i = 0; i < 400; i++) {
          for (const drop of rollLoot(source, tier)) {
            droppable.add(drop.baseItemId);
          }
        }
      }
    }
    for (const enemy of ENEMIES) {
      for (const drop of enemy.drops) droppable.add(drop.baseItemId);
    }

    for (const recipe of RECIPES) {
      for (const ingredient of recipe.ingredients) {
        expect(
          droppable.has(ingredient.baseItemId) ||
            shopStock.has(ingredient.baseItemId),
          `${ingredient.baseItemId} (for ${recipe.id}) must be obtainable`
        ).toBe(true);
      }
    }
  });

  it('NPC chatter and replies are non-empty for every character', () => {
    for (const npc of NPCS) {
      expect(npc.chatter.length, `${npc.id} has chatter`).toBeGreaterThan(0);
      expect(npc.replies.length, `${npc.id} has replies`).toBeGreaterThan(0);
      expect(npc.greetings.length, `${npc.id} has greetings`).toBeGreaterThan(
        0
      );
    }
  });

  it('no radio line carries its own speaker prefix', () => {
    // The chat UI renders "HANDLE: message". Lines that also began with the
    // speaker's name rendered as "BOONE: Boone: Cash first...".
    for (const npc of NPCS) {
      for (const line of [...npc.replies, ...npc.chatter]) {
        const prefix = line.slice(0, line.indexOf(':') + 1).toLowerCase();
        expect(
          prefix.startsWith(npc.name.toLowerCase() + ':') ||
            prefix.startsWith(npc.handle.toLowerCase() + ':'),
          `${npc.id} line must not repeat the speaker name: "${line}"`
        ).toBe(false);
      }
    }
  });
});

describe('Gear scaling', () => {
  it('rarity raises weapon damage monotonically', () => {
    const common = getWeaponDamage('Nail Bat', 'COMMON');
    const gold = getWeaponDamage('Nail Bat', 'GOLD');
    const mythical = getWeaponDamage('Nail Bat', 'MYTHICAL');

    expect(gold).toBeGreaterThan(common);
    expect(mythical).toBeGreaterThan(gold);
  });

  it('rarity raises armor defense monotonically', () => {
    expect(getArmorDefense('Riot Vest', 'GOLD')).toBeGreaterThan(
      getArmorDefense('Riot Vest', 'COMMON')
    );
  });

  it('non-gear has no damage or defense', () => {
    expect(getWeaponDamage('Scrap Metal')).toBe(0);
    expect(getArmorDefense('Scrap Metal')).toBe(0);
  });
});
