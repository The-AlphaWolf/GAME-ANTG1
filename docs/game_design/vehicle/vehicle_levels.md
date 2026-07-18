# Vehicle Levels System

## 1. Purpose
Define the overarching progression milestones for the vehicle as a unified entity, distinct from the individual component upgrades.

## 2. Responsibilities
- Calculate Vehicle Experience (VXP).
- Trigger whole-vehicle milestone evolutions.
- Grant evolution points for the `vehicle_evolution` system.

## 3. Gaining VXP
The vehicle earns VXP through operational use:
- **Driving**: 1 VXP per kilometer driven.
- **Exploration**: Bonus VXP for discovering new POIs.
- **Combat**: Ramming enemies, surviving attacks, or using mounted weapons.
- **Boss Kills**: Massive VXP spikes.
- **Quests**: Escort missions or courier tasks.

## 4. Level Up Rewards
When VXP reaches the threshold for a new level:
- Base Chassis max health increases.
- Base Fuel efficiency increases slightly.
- The player is granted **One Upgrade Point** to spend on the `vehicle_evolution` tree.

## 5. Milestone Evolutions
At major level thresholds (e.g., Level 10, 25, 50, 100), the entire vehicle undergoes a paradigm shift.
- **Level 1**: Common Van
- **Level 10**: Explorer Van (Expanded internal volume, off-road capable)
- **Level 25**: Armored Survival Van (Plating covers windows, heavy mass)
- **Level 50**: Mobile Fortress (Size of a small house, weapon mounts enabled)
- **Level 75**: Land Cruiser (Massive treaded or multi-wheel juggernaut)
- **Level 100**: Hover Fortress (Ignores terrain penalties, crosses water)
- **Level 150**: Legendary Mobile Citadel (Houses NPCs, automated defenses)
- **Level 200**: Mythical World Fortress (A roaming city)

*Note: These evolutions change the fundamental base class of the vehicle. All previously installed components and evolution paths scale up to match the new form factor.*

## 6. Edge Cases
- **Overleveling vs Components**: If a player reaches "Hover Fortress" but still has a Common Engine equipped, the engine will likely burn out instantly trying to move the massive weight. The AI must warn the player to upgrade their core components before accepting a Milestone Evolution.
- **Physical Space Constraints**: As the vehicle gets larger (Mobile Fortress+), it can no longer travel through narrow mountain passes or dense urban ruins, forcing the player to proceed on foot for certain POIs.

## 7. Dependencies
- Relies on: `vehicle_core`, `vehicle_evolution`, `player_stats`.

## 8. Persistence Requirements
- Save `VehicleXP`, `VehicleLevel`, and `CurrentMilestoneClass`.
