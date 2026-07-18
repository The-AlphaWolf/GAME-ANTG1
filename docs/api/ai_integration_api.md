# AI Integration API (Internal)

## 1. Purpose
Define the internal contracts between the Game Server and the AI Orchestration Layer (Prompt Router, Composer, and LLM). These endpoints are **NOT** exposed to the public internet.

## 2. Architecture
The Game Server treats the AI Layer as a microservice.

## 3. Endpoint: `POST /ai/generate-narration`
Called by the Game Server when the player makes a choice.

### Input
```json
{
  "player_id": "uuid",
  "context": {
    "current_state": { /* Game State JSON */ },
    "recent_memory": [ /* Array of last 5 interactions */ ],
    "player_action": "I floor the gas pedal and ram the mutants while screaming!"
  },
  "flags": {
    "is_combat": true,
    "danger_level": 5,
    "weather": "SANDSTORM"
  }
}
```

### Output
```json
{
  "narration": "The engine roars...",
  "commentary": "A bold, albeit reckless move...",
  "choices": [ ... ],
  "state_mutations": {
    "health_delta": -15,
    "fuel_delta": -5,
    "vehicle_wear_delta": -25
  }
}
```
*Note: The AI suggests state mutations (damage taken), but the Game Server validates them against hardcaps (e.g., ensuring the AI didn't kill the player for a minor mistake).*

---

## 4. Endpoint: `POST /ai/compress-memory`
Triggered via cron or after 20 interactions. Compresses short-term memory into a dense long-term vector.

### Input
```json
{
  "raw_logs": [ "Player met John.", "John asked for water.", "Player gave water.", "John gave a Common Sword." ]
}
```

### Output
```json
{
  "summary": "The player aided John, a thirsty survivor, in exchange for a Common Sword. Trust increased."
}
```
