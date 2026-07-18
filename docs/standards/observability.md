# Observability and Analytics

## 1. Purpose
Define the instrumentation required to monitor server health, track player behavior, and balance the game economy in real-time.

## 2. The Three Pillars of Observability
### A. Logs
- **Format**: All logs must be structured JSON to allow indexing by tools like Datadog or ELK (Elasticsearch, Logstash, Kibana).
- **Levels**:
  - `ERROR`: System failures (e.g., Database connection lost, LLM timeout). Triggers PagerDuty alerts.
  - `WARN`: Recoverable anomalies (e.g., Rate limit exceeded by a specific IP).
  - `INFO`: Standard lifecycle events (e.g., Service started, Player logged in).
  - `DEBUG`: Verbose data, disabled in Production.
- **Context**: Every log must include the `X-Request-ID` to trace the request across microservices.

### B. Metrics
- **System Metrics**: CPU, Memory, Network I/O, Database connection pools.
- **Game Metrics**: 
  - Average LLM generation latency.
  - Cache hit/miss ratio for the Game State.
  - Concurrent WebSocket connections.

### C. Traces
- Use OpenTelemetry to trace a request from the UI click -> API Gateway -> Game Server -> LLM API -> Database.

## 3. Game Analytics & Balancing
To ensure the Survival Road remains challenging but fair, we must track macro-economic and progression data.
- **Currency Velocity**: How much EC is being generated per hour vs how much is being spent in sinks (taxes, megaphones).
- **Rarity Distribution**: A live dashboard showing how many Mythical and Red items currently exist in the world. If the number spikes, the SSS Talent math may be broken.
- **Player Death Heatmap**: Which Danger Levels or specific Monster Types are causing the most deaths.
- **Choice Metrics**: In Combat, are players always choosing "Attack"? If "Defend" is only used 1% of the time, the defense mechanic needs rebalancing.

## 4. Security Auditing
- Log every instance of a 403 Forbidden or rate-limit violation.
- Flag accounts that generate statistically improbable strings of Critical Successes (Hidden Luck) for manual review by the anti-cheat team.
