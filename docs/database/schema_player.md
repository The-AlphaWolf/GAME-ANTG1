# Player Schema

## 1. Purpose
Define the data structures used to store the player's core identity, stats, inventory, and progression.

## 2. Table: `Players`
- `PlayerID` (UUID) - Primary Key
- `AccountID` (UUID) - Foreign Key to Identity Provider
- `Name` (String) - E.g., "Qing Zhou"
- `CreatedAt` (Timestamp)
- `LastLogin` (Timestamp)
- `IsAlive` (Boolean) - True/False
- `CurrentTitleID` (String) - Foreign Key to Titles

## 3. Table: `PlayerStats`
- `PlayerID` (UUID) - Foreign Key
- `Level` (Int)
- `Experience` (Int)
- `Health` (Float)
- `MaxHealth` (Float)
- `Energy` (Float)
- `Hunger` (Float)
- `Thirst` (Float)
- `Fatigue` (Float)
- `Sanity` (Float)
- `Strength` (Int)
- `Agility` (Int)
- `Endurance` (Int)
- `Intelligence` (Int)
- `Perception` (Int)
- `Charm` (Int)
- `HiddenLuck` (Int)
- `UpgradeChargesRemaining` (Int) - Max 6
- `LastChargeReset` (Timestamp)
- `WalletBalance` (Int)

## 4. Table: `PlayerInventory`
*Stores physical items held by the player (not in vehicle).*
- `InstanceID` (UUID) - Primary Key
- `PlayerID` (UUID) - Foreign Key (Indexed)
- `BaseItemID` (String)
- `Rarity` (Enum: 1-9)
- `Quantity` (Int)
- `CurrentDurability` (Float)
- `HasBeenUpgraded` (Boolean) - Prevents double SSS talent use
- `EquipSlot` (Enum: NULL, WEAPON, HEAD, CHEST, LEGS)

## 5. Table: `PlayerTalents`
*Stores unlocked secondary talents.*
- `PlayerID` (UUID) - Foreign Key
- `TalentID` (String)
- `IsEquipped` (Boolean)
- `UnlockedAt` (Timestamp)

## 6. Table: `PlayerQuests`
- `PlayerID` (UUID) - Foreign Key
- `QuestID` (String)
- `Status` (Enum: ACTIVE, COMPLETED, FAILED)
- `ProgressData` (JSON) - e.g., `{"monsters_killed": 4}`

## 7. Indexes
- `PlayerInventory (PlayerID, EquipSlot)` for fast retrieval of equipped gear.
- `Players (Name)` for social lookups.

## 8. Notes
- Because of Event Sourcing, these tables represent the *Read Models* (Projections) of the game state. The master truth is the Event Log.
