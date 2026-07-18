# Vehicle Schema

## 1. Purpose
Define the data structures used to store the state of the player's mobile base, its installed components, and its evolution tree.

## 2. Table: `Vehicles`
- `VehicleID` (UUID) - Primary Key
- `PlayerID` (UUID) - Foreign Key (Indexed)
- `Level` (Int)
- `Experience` (Int)
- `MilestoneClass` (Enum: VAN, EXPLORER, FORTRESS...)
- `TotalFuelCapacity` (Float)
- `CurrentFuel` (Float)
- `StorageCapacity` (Float)
- `AvailableEvolutionPoints` (Int)
- `PathsLockedOut` (JSON Array) - The 3 paths the player chose to ignore.

## 3. Table: `VehicleComponents`
*The 12 base operational slots + any active modules.*
- `InstanceID` (UUID) - Primary Key
- `VehicleID` (UUID) - Foreign Key
- `SlotType` (Enum: ENGINE, TIRES, ARMOR, AC, etc.)
- `BaseItemID` (String)
- `Rarity` (Enum: 1-9)
- `CurrentDurability` (Float)
- `HasBeenUpgraded` (Boolean)

## 4. Table: `VehicleEvolutionTree`
*Tracks the choices made in the 15 branching paths.*
- `VehicleID` (UUID) - Foreign Key
- `PathID` (Enum: LivingSpace, Kitchen, Weapons, etc.)
- `CurrentLevel` (Int)
- `SelectedNode` (String) - The specific branch chosen (e.g., "Cryo-Pod")

## 5. Table: `VehicleStorage`
*Similar to PlayerInventory, but bound to the vehicle.*
- `InstanceID` (UUID) - Primary Key
- `VehicleID` (UUID) - Foreign Key (Indexed)
- `BaseItemID` (String)
- `Rarity` (Enum)
- `Quantity` (Int)
- `CurrentDurability` (Float)
- `HasBeenUpgraded` (Boolean)

## 6. Indexes
- `VehicleComponents (VehicleID)` - Frequently queried together on every UI load.
- `VehicleStorage (VehicleID)`

## 7. Notes
- A player can only have one active Vehicle record. If destroyed, the record is flagged `IsDestroyed = True` and a new record must be created if they somehow acquire a new base chassis.
