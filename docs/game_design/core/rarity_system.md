# Rarity System

## 1. Purpose
Define the universal 9-tier rarity hierarchy. This system dictates the power, value, scarcity, and visual language of every item, vehicle part, skill, and chest in the game.

## 2. Responsibilities
- Provide a standardized scaling matrix for all objects.
- Feed the `primary_talent` upgrade system with valid state transitions.
- Determine the visual UI styling (colors, borders, glow effects).

## 3. The 9 Tiers
1. **Common** (White/Gray) - Standard, easily found, weak durability.
2. **Uncommon** (Green) - Minor stat boosts, standard enemy drops.
3. **Silver** (Silver/Metallic) - Significant durability, elite enemy drops, basic specialized items.
4. **Gold** (Gold/Yellow) - High power, requires rare materials to craft, boss drops.
5. **Orange** (Orange) - Legendary-tier for most standard games. Extreme stat boosts.
6. **Purple** (Deep Purple) - Epic/Mythic. Grants unique passive abilities alongside stats.
7. **Black** (Vantablack/Void) - Corrupted or incredibly lethal. Often comes with a trade-off or curse.
8. **Red** (Crimson) - Reality-bending items. Capable of altering world rules or massive AoE.
9. **Mythical** (Prismatic/Rainbow) - Unique, one-of-a-kind. Indestructible. Game-breaking if used creatively. 

## 4. Application Rules
- **Items/Weapons**: Rarity dictates base damage, durability, and number of buff slots.
- **Blueprints**: Rarity dictates the rarity of the output item. 
- **Vehicle Parts**: Rarity dictates efficiency, health, and special abilities (e.g., Mythical Engine = Infinite Fuel).
- **Treasure Chests**: Rarity dictates the loot table used and the danger level of the guardian monster.

## 5. Balancing Notes
- True RNG should only naturally spawn up to **Orange** rarity in the world during the Novice Period.
- **Purple, Black, Red, and Mythical** should generally only be obtainable via boss drops, extremely rare world events, or the player's SSS Unique Talent (Upgrade).

## 6. Edge Cases
- **Talent Upgrade Bounds**: Attempting to upgrade a Mythical item must return a clear "Max Tier Reached" response and NOT consume an upgrade charge.
- **Black Rarity Trade-offs**: Black tier items must have their negative effects clearly documented and enforced by the system, ensuring they cannot be bypassed by other buffs.

## 7. Dependencies
- Used by: `inventory_system`, `loot_tables`, `crafting_system`, `primary_talent`.

## 8. Persistence Requirements
- Rarity is a core enumerator (`enum RarityTier`). It must be saved as an immutable property of instantiated item objects.
