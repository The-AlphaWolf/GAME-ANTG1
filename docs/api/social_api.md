# Social and Trading API

## 1. Purpose
Define the endpoints for Chat, Trading, and Guild interactions. Note: Most social features utilize WebSockets for real-time delivery, but REST is used for transactional actions.

## 2. WebSocket: `wss://api.survivalroad.game/chat`
Connects the client to the global and private chat streams.

### Authentication
Token passed in initial connection payload.

### Subscriptions
Upon connecting, the client subscribes to channels:
- `global` (World Chat)
- `trade` (Trade Chat)
- `pm:{PlayerID}` (Private Messages)

### Event: `chat_message`
```json
{
  "event": "chat_message",
  "channel": "global",
  "sender": "[Night Stalker] Qing Zhou",
  "content": "Anyone seen a Merchant Caravan near KM 500?",
  "timestamp": "2026-07-18T10:00:00Z"
}
```

---

## 3. Endpoint: `POST /trade/list`
List an item on the Trade Chat.

### Input
```json
{
  "instance_id": "uuid-of-item",
  "price_ec": 5000,
  "barter_request_base_id": null
}
```

### Output (201 Created)
```json
{
  "listing_id": "uuid-of-listing",
  "tax_paid": 250
}
```

### Errors
- `400 Bad Request`: "Item cannot be traded."
- `403 Forbidden`: "Trade locked during Novice Period (Days 1-7)."

---

## 4. Endpoint: `POST /trade/purchase`
Buy an item listed by another player.

### Input
```json
{
  "listing_id": "uuid-of-listing"
}
```

### Output (200 OK)
Transaction is atomic. The server deducts EC, transfers the item instance to the buyer's inventory, and credits the seller's wallet.

### Errors
- `402 Payment Required`: "Insufficient Energy Credits."
- `404 Not Found`: "This listing has already been sold."
