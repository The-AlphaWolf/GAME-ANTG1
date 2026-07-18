# Game Loop API

## 1. Purpose
Define the core endpoints that drive the interactive text RPG gameplay. These endpoints handle player choices, inventory management, and vehicle upgrades.

## 2. Endpoint: `POST /action`
The primary endpoint for advancing the game state.

### Purpose
Submit a player choice or custom action to the AI Orchestration layer.

### Input
```json
{
  "action_type": "PREDEFINED | CUSTOM",
  "choice_id": "choice_3",
  "custom_text": "I floor the gas pedal and ram the mutants while screaming!"
}
```

### Output (200 OK)
```json
{
  "narration": {
    "text": "The engine roars as you slam the pedal to the floor...",
    "commentary": "A bold, albeit reckless move. Your front armor took a beating, but it worked."
  },
  "choices": [
    {"id": "c1", "text": "Inspect the wreckage."},
    {"id": "c2", "text": "Keep driving, don't look back."}
    // ... up to 6 choices
  ],
  "game_state": {
    // The massive, comprehensive JSON representing the entire player/vehicle state.
    // The client replaces its local cache with this object.
  }
}
```

### Errors
- `400 Bad Request`: "Invalid choice ID."
- `429 Too Many Requests`: "You are acting too fast."

---

## 3. Endpoint: `POST /inventory/upgrade`
Triggers the SSS Mythical Talent on an item.

### Input
```json
{
  "instance_id": "uuid-of-the-item"
}
```

### Output (200 OK)
```json
{
  "success": true,
  "rolls_executed": 2,
  "final_rarity": "SILVER",
  "charges_remaining": 5
}
```

### Errors
- `403 Forbidden`: "Zero upgrade charges remaining today."
- `409 Conflict`: "This item has already been upgraded once."

---

## 4. Endpoint: `POST /vehicle/evolve`
Locks in an evolution choice on the vehicle tree.

### Input
```json
{
  "path_id": "LIVING_SPACE",
  "node_id": "MED_BAY"
}
```

### Errors
- `403 Forbidden`: "You have no available evolution points."
- `409 Conflict`: "You have already locked out 3 other paths."
