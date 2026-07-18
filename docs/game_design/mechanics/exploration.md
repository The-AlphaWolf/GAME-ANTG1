# Exploration System

## 1. Purpose
Govern how the player navigates the Survival Road World, discovers points of interest, manages vehicle fuel, and calculates danger.

## 2. Responsibilities
- Generate dynamic points of interest (POIs) based on mileage/distance traveled.
- Manage fuel consumption and terrain traversal.
- Map the Danger Level to the distance traveled from the starting point.

## 3. World Generation & Travel
- The world is infinite and procedurally generated along the "Survival Road".
- **Travel Modes**:
  - **Driving**: Consumes Fuel. Fast. Generates Vehicle XP. High visibility.
  - **On Foot**: Consumes Energy/Water. Slow. Generates Player XP. Stealthy.
- **Fuel Consumption**: Scales with Vehicle Weight (Armor/Storage) and Engine efficiency.
- **Off-Road**: Leaving the main highway increases fuel consumption by 300% and rapidly degrades tires, but hides secret bunkers and high-tier chests.

## 4. Danger Level
- A global metric starting at Level 1.
- Increases steadily the further the player travels down the Road.
- Higher Danger Levels yield:
  - Higher rarity base chests.
  - More aggressive, mutated monster spawns.
  - Harsher weather anomalies.
- Returning to earlier zones is possible but yields no XP and only low-tier resources.

## 5. Points of Interest (POIs)
When traveling, the AI rolls for encounters:
- **Abandoned Gas Stations**: Source of fuel and basic supplies.
- **Ruined Cities**: High density of loot, extreme monster presence.
- **Merchant Caravans**: Trading opportunities (See `economy_trading`).
- **Military Checkpoints**: High-tier weapons, heavily fortified.
- **Dimensional Rifts**: Strange biomes, bizarre loot, logic-defying enemies.

## 6. Edge Cases
- **Running Out of Fuel**: The vehicle stops. The player must proceed on foot to find fuel. The vehicle becomes a stationary target for monster waves if unprotected.
- **Getting Lost**: Sandstorms or sanity drains can cause the player to travel in circles.

## 7. Dependencies
- Relies on: `vehicle_core`, `time_weather`, `monster_ai`, `loot_tables`.

## 8. AI Considerations
- The AI must vividly describe the changing landscape. The road should feel desolate, dangerous, and endless. 
- Emphasize the isolation during the Novice Period.
