# API Contracts Master

## 1. Purpose
Serve as the index and global configuration for all RESTful and WebSocket API endpoints used by the game client. 

## 2. Global Standards
- **Base URL**: `https://api.survivalroad.game/v1/`
- **Data Format**: JSON for all payloads.
- **Authentication**: JWT (JSON Web Tokens) passed in the `Authorization: Bearer <token>` header.
- **Versioning**: URI versioning (e.g., `/v1/`, `/v2/`) to ensure old clients aren't broken during mandatory updates.

## 3. Global Headers
- `X-Client-Version`: Enforces mandatory app updates.
- `X-Request-ID`: Used for tracing the event through the microservices (Observability).

## 4. Standard Error Responses
Errors follow a strict schema to allow the client to handle them gracefully.
```json
{
  "error": {
    "code": "INSUFFICIENT_FUNDS",
    "message": "You do not have enough Energy Credits.",
    "details": {
      "required": 500,
      "current": 200
    }
  }
}
```

## 5. Global Rate Limits
- Unauthenticated endpoints (Login/Register): 5 req / minute.
- Standard Gameplay actions (`/action`): 30 req / minute.
- Polling endpoints (`/status`): 120 req / minute.

## 6. Endpoints Index
- **Game Loop**: See `game_loop_api.md`
- **Social / Trading**: See `social_api.md`
- **AI Integration (Internal)**: See `ai_integration_api.md`
