# Loot Tables and Treasure Chests

## 1. Purpose
Control the distribution of rewards, ensuring scarcity, maintaining the rarity hierarchy, and balancing the economy.

## 2. Responsibilities
- Calculate item drops based on enemy type, danger level, and player luck.
- Define the contents and mechanics of Treasure Chests.

## 3. Treasure Chest Mechanics
- **Spawn Rules**: Every player starts with one random chest (usually Common to Silver). Further chests are found via exploration or dropped by bosses.
- **Guarding Logic**: High-tier chests are *always* guarded. The Danger Level of the guardian is proportional to the chest's rarity. 
- **Opening**: Opening a chest takes time and leaves the player vulnerable (unless inside the locked vehicle).
- **Upgrading**: The player's SSS Unique Talent CAN be used on unopened chests to upgrade their rarity tier before opening.

## 4. Loot Table Architecture (Weighted RNG)
Loot drops are calculated using weighted pools.
- **Base Pool**: Determined by the source (e.g., Level 5 Brute, Gold Chest).
- **Rolls**: Number of items generated (e.g., 2-4 items).
- **Rarity Check**: For each item, roll against a probability matrix.
  - *Example Silver Chest Matrix*: Common 0%, Uncommon 40%, Silver 50%, Gold 9%, Orange 1%.
- **Player Luck Modifier**: `Hidden Luck` slightly shifts the matrix percentages towards higher rarities.

## 5. Dynamic Scarcity
- The game maintains a global (or seed-based) counter for Red and Mythical items.
- If a player finds a Mythical item, the probability of finding another one drops drastically to maintain absolute scarcity.

## 6. Edge Cases
- **Inventory Full on Open**: If a chest drops more items than the player can carry, the excess items drop on the ground. They will despawn if the player leaves the area.
- **Novice Period Exploit**: During Days 1-7, players cannot be damaged by chest guardians. However, the guardian *will* block the chest from being opened until defeated. (The player is immune to damage, but lacks the DPS to kill a Gold guardian at level 1, preventing early-game breaking).

## 7. Dependencies
- Relies on: `rarity_system`, `inventory_system`, `player_stats`.

## 8. Persistence Requirements
- Once a chest is spawned in the world, its seed or exact contents must be saved so save-scumming (reloading the game to get different loot from the same chest) is prevented.
