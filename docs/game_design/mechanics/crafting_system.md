# Crafting System

## 1. Purpose
Define how players create items, weapons, armor, and vehicle parts using resources, materials, and blueprints found in the world.

## 2. Responsibilities
- Manage the consumption of raw resources and the generation of finished items.
- Enforce blueprint requirements.
- Handle crafting queues, times, and critical successes.

## 3. Core Mechanics
- **Blueprints**: A recipe must be unlocked via a Blueprint before it can be crafted. Blueprints have rarity. A Purple blueprint creates a Purple item.
- **Resources**: Gathered from the world (Wood, Scrap Metal, Electronic Components, Biogel, etc.).
- **Workstations**: Crafting requires specific stations (e.g., Basic Workbench, Forge, Chemistry Lab). These are installed in the Vehicle's "Living Space" or "Storage" upgrade paths.
- **Crafting Time**: Based on item rarity and player `Intelligence`. Instant for Common/Uncommon, takes hours for Gold+.

## 4. The Crafting Process
1. Player selects unlocked Blueprint.
2. System verifies Inventory has required Resources and required Workstation.
3. System deducts Resources.
4. Crafting begins (Timer starts).
5. Upon completion, item is deposited into Inventory or Vehicle Storage.

## 5. Critical Success (Hidden Luck)
- Every crafting action rolls against the player's `Hidden Luck` stat.
- On a critical success (e.g., 5% chance), the item is crafted at +1 Rarity Tier without costing extra materials. (e.g., Crafting a Gold Engine yields an Orange Engine).

## 6. SSS Mythical Upgrade Talent Interaction
- The Upgrade talent CANNOT be used on Blueprints to learn a higher tier. It can only be used on the physical Blueprint item *before* it is consumed, or on the finished crafted item.
- Upgrading a Blueprint item before consuming it permanently unlocks the higher-tier recipe.

## 7. Edge Cases
- **Interrupted Crafting**: If a workstation is destroyed (vehicle damage), crafting halts and 50% of materials are refunded.
- **Inventory Full**: If inventory is full when crafting completes, the item remains in the workstation's output buffer until space is cleared.

## 8. Dependencies
- Relies on: `inventory_system`, `primary_talent`, `vehicle_evolution`.

## 9. AI Considerations
- The AI should describe the crafting process atmospherically (e.g., sparks flying, the hum of the 3D printer).
