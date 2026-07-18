# Performance Budget

## 1. Purpose
Define the maximum acceptable resource utilization constraints for the game. Even for a text/UI-heavy RPG, performance dictates user retention and server costs.

## 2. Client-Side Constraints (Mobile & PC)
- **UI Rendering**: 60 FPS target. The UI contains complex particle effects (for Rarity glows) and animations.
- **Memory (RAM)**: Target < 500MB on mobile. Do not load assets for undiscovered biomes.
- **Storage**: < 1GB initial download. Use procedural generation rather than massive pre-baked texture atlases where possible.
- **Battery Drain**: Must be optimized for long play sessions. Provide a "Power Saver" mode that disables background particle effects.

## 3. Server-Side Constraints
- **Database Reads/Writes**: The event-sourcing model is write-heavy. Use an in-memory cache (Redis) for hot player state and flush to persistent storage in batches.
- **LLM Token Budget**: 
  - Strict limits on context windows to control API costs.
  - Max Context per action: 2000 tokens.
  - Max Generation per action: 300 tokens.
- **Response Time Target**: 
  - Non-LLM actions (Inventory management, UI clicks): < 100ms.
  - LLM-resolved actions (Combat, Custom Choices): < 3000ms.

## 4. Network Constraints
- **Payload Size**: The compressed JSON game state synced to the client must not exceed 50KB per turn to ensure playability on weak mobile networks.
- **Image Generation (If Applicable)**: If generating dynamic imagery, images must be heavily compressed (WebP) and cached via CDN.

## 5. Monitoring & Observability
- Server performance must be monitored. If LLM response times spike above 5 seconds, the system should trigger a fail-safe degraded mode (e.g., simpler pre-written responses instead of dynamic LLM generation) to keep the game playable.

## 6. Dependencies
- Relies on: `networking`, `ai_orchestration`.
