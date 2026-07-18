# Database Architecture

## 1. Purpose
Document the macro-level architecture of the persistence layer, including caching, data retention, indexing strategies, and disaster recovery.

## 2. Event Store (The Single Source of Truth)
- **Technology**: Kafka, EventStoreDB, or an append-only PostgreSQL table.
- **Table `EventLog`**:
  - `EventID` (UUID v7, time-sorted)
  - `Timestamp` (UTC)
  - `PlayerID` (UUID)
  - `EventType` (String)
  - `Payload` (JSONB)
- **Immutability**: Records in `EventLog` are NEVER updated or deleted.

## 3. Read Projections (The Game State)
- **Technology**: PostgreSQL (or equivalent relational DB).
- **Function**: Background workers read the `EventLog` and mutate the schemas defined in `schema_player`, `schema_vehicle`, and `schema_world`.
- **Latency**: Event processing must happen in < 50ms so the read projections are immediately available for the next API call.

## 4. Caching Layer
- **Technology**: Redis.
- **Strategy**: The client fetches the entire Game State JSON object. Instead of joining 15 SQL tables per request, the assembled JSON is cached in Redis using the key `player_state:{PlayerID}`.
- **Invalidation**: The background worker invalidates or updates the Redis cache whenever it processes an event for that player.

## 5. Partitioning and Sharding
- `EventLog` is partitioned by `Month`.
- `ChatLogs` is partitioned by `Day`.
- As the player base scales post-Day 7, `WorldObjects` and `NPCs` are sharded based on `SectorID` to distribute geographic load.

## 6. Data Retention and Soft Deletes
- **Soft Deletes**: Deleting a character or dropping an item does not remove the row from the Read Projections. It flips a boolean (`IsAlive = false`, or sets an `ArchivedAt` timestamp).
- **Data Retention**:
  - `ChatLogs` (World/Trade): Dropped automatically after 7 days.
  - `WorldObjects`: Dropped loot despawns (deleted from projections) after 48 in-game hours if not interacted with.
  - `EventLog`: Retained forever. Migrated to cold storage (AWS S3) after 1 year.

## 7. Disaster Recovery
- Point-in-Time Recovery (PITR) enabled on the PostgreSQL cluster.
- In catastrophic failure, the entire Read Projection database can be truncated and rebuilt by replaying the `EventLog` from Event 0.
