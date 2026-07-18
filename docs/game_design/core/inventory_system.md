# Inventory System

## 1. Purpose
Define how the player stores, organizes, and interacts with collected items, blueprints, and resources.

## 2. Responsibilities
- Track all items owned by the player.
- Enforce carry weight limits based on the `Strength` stat.
- Categorize items for UI rendering (Weapons, Armor, Food, Water, Resources, Materials, Blueprints, Vehicle Parts, Quest Items, Currency).

## 3. Data Structure
Each item instance requires:
- `ItemID` (UUID)
- `BaseID` (Reference to master item dictionary)
- `Rarity` (Enum)
- `Quantity` (Int, for stackable items)
- `Durability` (Float, if applicable)
- `Modifiers` (Array of buffs/debuffs)

## 4. Carry Weight Mechanics
- Base Carry Weight is determined by `Strength * Multiplier`.
- **Overencumbered State**: Exceeding weight capacity by 0-25% disables sprinting. 25-50% halves walk speed. >50% roots the player in place.
- **Vehicle Storage**: The vehicle has a separate, much larger storage capacity determined by its "Storage Space" evolution tree. Items in vehicle storage cannot be used in combat unless specifically equipped to the vehicle.

## 5. Item Categories & Stacking
- **Resources / Materials**: Stackable (e.g., x99 Wood).
- **Consumables (Food/Water)**: Stackable, but track spoilage/expiration if applicable.
- **Weapons / Armor / Vehicle Parts**: Non-stackable. Each has unique durability and modifiers.
- **Blueprints**: Non-stackable. Consumed upon learning (permanently unlocks crafting).
- **Quest Items**: Zero weight, un-droppable unless quest permits.

## 6. Edge Cases & Failure Cases
- **Looting while full**: Attempting to loot an item while over capacity should prompt the player to swap or drop an item, leaving the loot in the container/chest.
- **Vehicle destruction/loss**: If the vehicle is severely damaged, is storage accessible? (Storage should remain intact unless the specific Storage module is destroyed).

## 7. Developer Notes
- Ensure transactional safety when moving items between Player Inventory and Vehicle Storage to prevent duplication exploits.
- The UI must allow fast filtering and sorting by Category, Rarity, and Weight.

## 8. Persistence Requirements
- Inventory state must be serialized as a JSON array of item objects.
- Changes to inventory must be logged as discrete events (e.g., `ITEM_ADDED`, `ITEM_REMOVED`, `ITEM_CONSUMED`) for event-sourcing.
