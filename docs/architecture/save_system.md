# Save System and Persistence

## 1. Purpose
Design an impenetrable, event-sourced persistent save system ensuring no progress is ever lost and any state can be rebuilt.

## 2. Event Sourcing Architecture
Instead of saving the final state of the player (e.g., `Health: 50`), the database saves the *events* that led to that state.
- **Event Log**: `PLAYER_CREATED`, `ITEM_LOOTED(Common_Sword)`, `DAMAGE_TAKEN(50, Brute)`.
- **Snapshots**: To prevent massive load times, a compiled "Snapshot" of the state is generated every 100 events (or upon exiting the game).

## 3. Rollback Capabilities
- Because every action is an event, customer support (or the system itself) can roll back the game state to any specific timestamp before a corruption or game-breaking bug occurred.

## 4. Version Migration
- When the game updates (e.g., a weapon is removed or a stat is changed), the `Event Replayer` must handle legacy events.
- If an item is deprecated, the migration script intercepts the `ITEM_LOOTED(Deprecated_Item)` event and maps it to `ITEM_LOOTED(New_Equivalent_Item)`.

## 5. Anti-Save-Scumming
- The game auto-saves (pushes events) to the cloud instantaneously upon any RNG roll (Chest open, Upgrade talent use).
- Players cannot reload an older save to try for a better roll. The event is already recorded.

## 6. Edge Cases
- **Offline Play**: If the game supports offline mode, events are queued locally. Upon reconnection, they are synchronized. If a conflict occurs (e.g., trying to trade an item that was already traded on another device), the server timestamp wins.

## 7. Data Structure
- `EventID` (UUID)
- `Timestamp`
- `PlayerID`
- `EventType` (Enum)
- `Payload` (JSON specific to the event)
- `Signature` (Hash for anti-cheat verification)
