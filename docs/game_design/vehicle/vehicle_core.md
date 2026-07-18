# Vehicle Core System

## 1. Purpose
Define the fundamental mechanics of the player's mobile base, the most critical asset for survival. The vehicle provides shelter, transport, storage, and eventually offensive/defensive capabilities.

## 2. Responsibilities
- Manage vehicle stats (Durability, Fuel, Speed, Armor).
- Track the installation and wear of base components.
- Calculate fuel efficiency based on terrain and weight.

## 3. Base Components
Every vehicle consists of core components. Each has an independent rarity that affects overall vehicle stats:
- **Engine**: Determines top speed, acceleration, and fuel efficiency.
- **Transmission**: Affects terrain traversal penalties.
- **Tires**: Dictates off-road capability and slip during rain/snow.
- **Windows**: Fragile points. If broken, weather and monsters can bypass vehicle armor.
- **Chassis**: The core structural health. If this reaches 0, the vehicle is destroyed.
- **Armor**: Outer plating that mitigates damage to the chassis and interior components.
- **Storage**: Dictates the separate vehicle inventory weight limit.
- **Suspension**: Reduces wear from off-road driving.
- **Fuel System**: Max fuel capacity and leak prevention.
- **Power Source / Battery**: Powers electronics (lights, radar, AC).
- **Lighting**: Headlights for night driving and sanity preservation.
- **Sensors**: Radar, danger detection, mapping.

## 4. Vehicle Wear and Maintenance
- Components degrade through use (driving off-road, combat, weather exposure).
- `Vehicle Wear` must be managed using Repair Kits and raw materials (Scrap Metal, Electronics).
- A component that reaches 0 Durability ceases to function (e.g., Engine failure halts movement; Tire blowout drastically reduces speed).

## 5. Security & Access
- The vehicle doors can be locked. While locked, monsters below a certain Danger Level cannot enter or damage the player directly, though they can damage the vehicle's exterior.

## 6. Edge Cases
- **Vehicle Destruction**: If the Chassis reaches 0 Durability, the vehicle is totaled. The player is ejected. They must survive on foot and either find extreme resources to repair it or perish. (In a roguelike setup, this often ends the run. In persistence, it requires a massive rescue effort or finding a new chassis).
- **Submersion**: Driving into deep water instantly ruins the Engine and Power Source unless upgraded with amphibious/hover capabilities.

## 7. Dependencies
- Relies on: `inventory_system` (storage), `time_weather` (environmental wear), `exploration` (fuel burn).

## 8. Persistence Requirements
- Vehicle state requires deep serialization. Every component's current Durability, Rarity, and active Modifiers must be saved.
