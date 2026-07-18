# World Schema

## 1. Purpose
Define the data structures for the persistent world, tracking time, weather, NPCs, and instantiated objects like treasure chests.

## 2. Table: `WorldState`
*Global single-row table (or partitioned by Shard/Sector in multiplayer).*
- `SectorID` (String) - Primary Key
- `CurrentDay` (Int)
- `CurrentTime` (Time/String) - HH:MM
- `WeatherState` (Enum)
- `BaseTemperature` (Float)
- `DangerLevelModifier` (Float)
- `ActiveGlobalEvent` (String) - E.g., "Blood Moon"

## 3. Table: `NPCs`
*Persistent AI characters.*
- `NpcID` (UUID) - Primary Key
- `BaseTypeID` (String)
- `Name` (String)
- `SectorID` (String) - Where they currently are
- `Health` (Float)
- `IsAlive` (Boolean)
- `LongTermMemory` (Text) - Summarized by AI

## 4. Table: `PlayerNpcRelationships`
*The matrix connecting players to NPCs.*
- `PlayerID` (UUID) - Foreign Key
- `NpcID` (UUID) - Foreign Key
- `Trust` (Int: -100 to 100)
- `Respect` (Int: -100 to 100)
- `Affection` (Int: -100 to 100)
- `FirstMetAt` (Timestamp)

## 5. Table: `WorldObjects`
*Persistent chests, abandoned vehicles, dropped loot.*
- `ObjectID` (UUID) - Primary Key
- `SectorID` (String) - Foreign Key
- `ObjectType` (Enum: CHEST, CORPSE, DROP)
- `Rarity` (Enum) - Defines chest appearance
- `LootSeed` (String) - Prevents save-scumming by locking the loot table outcome when spawned.
- `IsGuarded` (Boolean)
- `GuardianDefeated` (Boolean)
- `HasBeenOpened` (Boolean)
- `HasBeenUpgraded` (Boolean) - For chests upgraded by the SSS talent.

## 6. Table: `ChatLogs`
*Storage for Private Messages and ephemeral World Chat.*
- `MessageID` (UUID) - Primary Key
- `Channel` (Enum: WORLD, TRADE, PM, SYSTEM)
- `SenderID` (UUID) - Null if System
- `RecipientID` (UUID) - Null if not PM
- `Timestamp` (Timestamp)
- `Content` (Text)
- `IsAnonymous` (Boolean)

## 7. Indexes
- `WorldObjects (SectorID, HasBeenOpened)` - Fast querying of active POIs in the player's zone.
- `PlayerNpcRelationships (PlayerID)`
