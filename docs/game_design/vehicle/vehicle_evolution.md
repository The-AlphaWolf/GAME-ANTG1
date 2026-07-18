# Vehicle Evolution System

## 1. Purpose
Control the massive, branching upgrade paths that transform the starting Common Van into a specialized, high-tier fortress.

## 2. Responsibilities
- Enforce the 12-slot limit from the 15 available paths.
- Define the branching evolution trees for each path.
- Prevent contradictory upgrades.

## 3. The 15 Upgrade Paths
The vehicle has 15 potential paths. **Only 12 can be selected.** The unselected 3 are permanently locked out for the lifespan of that vehicle.
1. Tires
2. Windows
3. Chassis
4. Armor
5. Storage Space
6. Living space (Bathroom + Bedroom)
7. Kitchen
8. Music and entertainment (Affects Sanity/Morale)
9. Headlights
10. Weapons
11. Radar / Sensors
12. Engine
13. Lighting (Internal/Aesthetic)
14. AC (Temperature control)
15. Water (Filtration and internal supply)

## 4. Evolution Logic
- When a path is unlocked, it starts at Level 1.
- At specific vehicle milestones (or by using a high-tier Blueprint), the path can be upgraded.
- **Branching Choices**: At each upgrade level, the player MUST choose one specific evolution, locking out the alternatives for that path forever.
  - *Example (Living Space)*: 
    - Lvl 1: Basic Cot
    - Lvl 2 Choice: [Luxury Bed (High Sanity regen)] OR [Med-Bay Bed (High Health regen)]
    - Lvl 3 Choice (if Med-Bay): [Surgical Suite (Cures ailments)] OR [Cryo-Pod (Suspends negative effects)]

## 5. Blueprint Bypasses
- Players can find physical Blueprints for high-tier modules (e.g., "Blueprint: Plasma Cannon").
- Installing a module via Blueprint DOES NOT consume one of the 12 core upgrade slots, allowing players to exceed the 12-slot limit if they get lucky with exploration/drops.

## 6. Edge Cases
- **Path Locking Strategy**: If a player locks out "AC", they must rely entirely on personal clothing/armor for temperature control, or they will die in the Desert/Tundra biomes. The UI must clearly warn the player before finalizing a path lockout.
- **Conflicting Upgrades**: Ensure UI logic prevents selecting evolutions that physically contradict (e.g., Hover-jets cannot be installed if Heavy Tank Treads were selected, unless specified in a Mythical evolution).

## 7. Developer Notes
- The UI panel for this must be a visually distinct "Tech Tree". 
- AI Prompt generation must query the current state of the 12 paths to accurately describe the vehicle's appearance.

## 8. Dependencies
- Relies on: `vehicle_core`, `vehicle_levels`, `crafting_system`.
