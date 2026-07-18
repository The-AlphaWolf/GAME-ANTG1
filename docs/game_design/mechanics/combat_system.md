# Combat System

## 1. Purpose
Dictate the rules of engagement between the player, monsters, bosses, and potentially other players (post-Day 7). Combat in this game is tactical, narrative-driven, and highly consequential.

## 2. Responsibilities
- Resolve combat encounters using player stats, equipment, and enemy AI.
- Calculate damage, mitigation (armor), and critical hits.
- Manage status effects (Bleed, Poison, Stun).
- Feed narrative outcomes to the AI for dynamic descriptions.

## 3. Combat Mechanics
- **Turn-based vs Real-time**: Combat is resolved as discrete, tactical exchanges. The AI presents the scenario, enemy intent, and environment. The player inputs an action. The AI resolves the exchange.
- **Hit Chance**: Determined by Player `Agility` vs Enemy `Evasion`, plus weapon accuracy.
- **Damage Output**: Base Weapon Damage + (Player `Strength` or `Agility` depending on weapon type) * Rarity Multiplier.
- **Mitigation**: Armor absorbs a percentage of damage based on its defensive value and rarity. Armor degrades during combat.
- **Weaknesses**: Enemies have specific elemental or physical vulnerabilities. Hitting a weakness doubles damage and may inflict a Stun.

## 4. Tactical Elements
- **Terrain**: The environment must play a role. (e.g., using a chokepoint, high ground, taking cover behind the van).
- **Weather**: Rain reduces fire damage; Sandstorms reduce ranged accuracy.
- **Vehicle Weapons**: If the vehicle has mounted weapons (from evolution tree), they can be utilized in combat for massive damage, consuming fuel/ammo.

## 5. Enemy Types & Scaling
- **Standard Monsters**: Scale with the player's level and the zone's Danger Level.
- **Elites**: Have one guaranteed random buff (e.g., "Armored", "Venomous") and drop Silver/Gold chests.
- **Bosses**: Require multi-stage tactics. Cannot be defeated by brute force alone; require exploiting weaknesses or environmental hazards.

## 6. Edge Cases
- **Fleeing**: Always an option, but success chance depends on `Agility` and vehicle proximity. Failure to flee results in a free attack for the enemy.
- **Zero Durability**: If a weapon breaks mid-combat, damage drops to unarmed levels (1-2 damage).
- **Novice Period Immunity**: During Days 1-7, if a player discovers a high-tier chest, the guarding monsters *cannot* damage the player. The AI must explicitly describe the monster as bound by an invisible force or unable to perceive the player.

## 7. Dependencies
- Relies on: `player_stats`, `inventory_system`, `monster_ai`, `time_weather`.

## 8. Persistence Requirements
- Combat state (Enemy HP, status effects, player HP) must be saved per action so that closing the game mid-combat does not reset the encounter.
