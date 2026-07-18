# Networking Strategy

## 1. Purpose
Define the client-server architecture, state synchronization, and communication protocols for the game. Although the game features asynchronous mechanics, robust networking is required for chat, trading, and post-Novice period multiplayer.

## 2. Architecture
- **Client**: Thin client. Responsible *only* for rendering the UI, parsing the JSON state returned by the server, and capturing user input.
- **Server**: Authoritative Game Server. Runs the Game Loop, manages the Database connections, and queries the LLM services.
- **Protocol**: 
  - Standard gameplay actions use **RESTful HTTPS** for reliable, stateless request/response.
  - Chat and Guild/Convoy updates use **WebSockets (WSS)** for real-time bidirectional events.

## 3. State Synchronization
- When the player makes a choice, the client sends a `POST /action` request.
- The server processes the action, mutates the Game State, generates the AI narration, and returns a unified JSON payload containing the updated Game State and the text block.
- The client completely replaces its local state cache with the server's response. There is no client-side prediction needed for a text/menu-based RPG, completely eliminating desync issues.

## 4. Multiplayer Constraints (Post-Day 7)
- **Sharding/Instancing**: The Survival Road is infinite. Players are instanced into "Sectors" (e.g., Kilometer 10,000 to 10,100). If two players are in the same sector, they can interact.
- **Concurrency**: If two players engage the same World Boss, the server must resolve their actions sequentially using optimistic locking on the Boss's health pool in the database.

## 5. Edge Cases
- **Disconnects**: If the client disconnects mid-combat, the server pauses the combat instance for 5 minutes. After 5 minutes, it forces a "Flee" action or auto-resolves a defeat if fleeing is impossible.
- **LLM Latency**: The network architecture must account for LLM processing time (which can take 1-5 seconds). The client must display a compelling "Processing..." animation (e.g., static noise, scanning radar).

## 6. Dependencies
- Relies on: `api_contracts`, `save_system`.
