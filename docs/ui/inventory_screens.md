# Inventory Screens Design

## 1. Purpose
Define how the player manages their massive accumulation of loot, resources, and blueprints.

## 2. Layout Architecture
- **Tabbed Interface**:
  - `Player Backpack` (Subject to Carry Weight limit).
  - `Vehicle Storage` (Subject to massive Storage limit. Only accessible when near/in vehicle).
  - `Equipped Gear` (Paper-doll interface showing Head, Chest, Legs, Weapon).

## 3. Item Cards
Every item in the inventory is represented by a card or list row containing:
- Icon (Generic to item type, colored by Rarity).
- Name.
- Quantity (if stackable).
- Weight.
- "Upgraded" Star Icon (if the SSS talent was used on it).

## 4. Interactions
- **Tap/Click Item**: Opens Context Menu.
  - *Options*: Equip/Use, Drop, Transfer to Vehicle, Upgrade (SSS Talent), List on Trade Chat.
- **Drag & Drop**: Supported on Desktop for fast transferring between Backpack and Vehicle Storage.
- **Filtering & Sorting**: 
  - Essential feature. Filters for: Weapons, Armor, Consumables, Blueprints, Materials.
  - Sort by: Rarity, Weight, Value, Recent.

## 5. The "Upgrade" Flow
- When the player selects "Upgrade" from the item context menu:
  - A cinematic modal overlays the screen.
  - The UI displays the 4-stage probability chances (100% -> 30% -> 5% -> 0.05%).
  - The player clicks "Execute".
  - A brief, suspenseful animation plays (RNG rolling visually).
  - The result is displayed ("Success! Silver -> Gold", or "Failed at Stage 2").
  - The item card updates immediately.

## 6. Edge Cases
- **Overencumbered Warning**: If a transfer from Vehicle to Backpack exceeds weight limits, the screen pulses red and blocks the transaction with a toast notification: "Strength too low. Cannot carry."
