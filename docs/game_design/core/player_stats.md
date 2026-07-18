# Player Stats System

## 1. Purpose
Define the core metrics of player survival, progression, and physical condition. The system acts as the foundational heartbeat for all other systems (Combat, Exploration, Crafting).

## 2. Responsibilities
- Track and update vital stats in real-time (or per tick/action).
- Apply buffs/debuffs based on environmental factors (Weather, Danger Level).
- Broadcast stat changes to the UI HUD and AI Prompts for contextual narration.

## 3. Core Attributes (Base Stats)
Each player has a set of primary attributes. These start average but grow through progression:
- **Strength**: Affects carry weight, melee damage, and ability to move heavy obstacles.
- **Agility**: Affects dodge chance, movement speed, and ranged weapon accuracy.
- **Endurance**: Affects max health, fatigue resistance, and stamina drain.
- **Intelligence**: Affects crafting speed, blueprint discovery rate, and complex interactions.
- **Perception**: Affects detection of hidden chests, traps, and danger level awareness.
- **Charm**: Affects NPC interactions, trade prices, and romance progression.
- **Hidden Luck**: Invisible stat affecting loot rarity rolls, critical successes, and random event positivity.

## 4. Survival Metrics
- **Health (0-100%)**: Drops from damage, extreme weather, or 0% Food/Water. Death occurs at 0%.
- **Energy/Stamina (0-100%)**: Consumed by running, fighting, heavy lifting. Regenerates slowly or by resting.
- **Hunger (0-100%)**: Drains constantly over time and during heavy exertion. Debuffs trigger at <20%. 
- **Thirst (0-100%)**: Drains faster than hunger, especially in hot weather. Debuffs trigger at <30%.
- **Fatigue (0-100%)**: Represents sleep deprivation. Increases if the player stays awake past 24 hours. High fatigue lowers max Energy and Sanity.
- **Sanity (0-100%)**: Drains in absolute darkness, high danger areas, or after witnessing horrors. Low sanity causes hallucinations (UI glitches, false radar pings, inaccurate narrator descriptions).

## 5. Experience & Leveling
- **Experience (XP)**: Earned via combat, crafting, survival time, completing quests, and opening chests.
- **Level**: Increases when XP thresholds are met. Grants attribute points and unlocks higher-tier content (e.g. secondary talents).

## 6. Edge Cases & Failure Cases
- **Simultaneous Zeroes**: If Thirst and Hunger hit 0% at the same time, Health drain multipliers stack.
- **Sanity Break**: If Sanity hits 0%, the AI narrator must actively deceive the player about their inventory and surroundings until sanity is restored.
- **Infinite Loops**: Ensure regeneration buffs cannot exceed the absolute maximum cap (100%).

## 7. Dependencies
- Relies on: `time_weather` (temperature affects thirst/health), `inventory_system` (consuming items restores stats), `combat_system` (health reduction).

## 8. Persistence Requirements
- Every stat must be saved in the event-sourced database. Deltas must be recorded for rollback purposes. 

## 9. Developer & AI Notes
- AI Prompts must heavily reference `Sanity` and `Fatigue` when generating the world description. Low sanity should result in eerie, unreliable narration.
- Do NOT auto-regenerate Health unless specific items/buffs are active.
