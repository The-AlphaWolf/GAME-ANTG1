# Testing Pyramid

## 1. Purpose
Ensure the stability and reliability of the Survival Road RPG through rigorous, automated testing at multiple layers.

## 2. The Pyramid Structure
The team will adhere to a 70/20/10 testing ratio.

### Layer 1: Unit Tests (70%)
- **Scope**: Testing individual functions, classes, and logic blocks in isolation.
- **Tools**: Jest, Mocha, or JUnit (depending on stack).
- **Focus Areas**:
  - `DamageCalculator`: Feed it mock stats, assert correct damage output.
  - `RarityRoller`: Run it 10,000 times, assert the statistical distribution matches the loot tables.
  - `TalentUpgrader`: Assert that a Mythical item rejects an upgrade attempt.
- **Requirement**: Must run in < 1 minute. Mock all external dependencies (DB, LLM).

### Layer 2: Integration Tests (20%)
- **Scope**: Testing the interaction between multiple modules or bounded contexts.
- **Tools**: Supertest, Testcontainers.
- **Focus Areas**:
  - `Database + Event Replayer`: Ensure that emitting a `DAMAGE_TAKEN` event correctly updates the PostgreSQL Read Projection.
  - `API Endpoints`: Send a mocked HTTP request to `POST /action`, assert a 200 OK and valid JSON schema response.

### Layer 3: End-to-End (E2E) Tests (10%)
- **Scope**: Testing the entire system from the Client UI down to the Database.
- **Tools**: Cypress, Playwright.
- **Focus Areas**:
  - `The FTUE (First Time User Experience)`: Simulate a user clicking through the tutorial, validating that the UI renders the HUD correctly and the server persists the state.
  - `LLM Fallback`: Intentionally break the mocked LLM API connection and assert that the client gracefully displays the "Temporal Anomaly" error state without crashing.

## 3. Load Testing (Non-Functional)
- **Scope**: Ensuring the server can handle 10,000 concurrent connections.
- **Tools**: Artillery, K6.
- **Focus**: Hammering the WebSocket chat servers and the `/action` REST endpoint.

## 4. AI Prompt Testing
- **Scope**: Ensuring the LLM does not hallucinate or break JSON format.
- **Strategy**: Use an LLM-evaluation framework. Feed the Prompt Composer 100 different game states, parse the LLM's output, and assert that 100% of the outputs contain valid JSON and do not mention items the player doesn't possess.
