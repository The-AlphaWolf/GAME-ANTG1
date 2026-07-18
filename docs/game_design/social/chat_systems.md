# Chat Systems

## 1. Purpose
Define the primary communication methods for players in a solitary, isolated world. Chat serves as the main source of lore, trading, and community building, especially during the Novice Period when physical interaction is disabled.

## 2. Responsibilities
- Manage World Chat, Trade Chat, and Private Messages.
- Generate simulated chat logs (if playing single-player or to pad low population).
- Ensure player anonymity unless explicitly revealed.

## 3. Channels
- **World Chat**: Global channel. The AI should generate lively simulated chat. 
  - *Simulation Parameters*: Panic, bragging, sharing fake/real rumors, death notices ("Player X died to Level 5 Mutated Wolf"), jokes, and System Announcements.
  - *Rate Limits*: Players are limited to 3 messages per hour to prevent spam. Extra messages cost `Megaphones` (a premium/rare consumable).
- **Trade Chat**: Dedicated to bartering (See `economy_trading.md`).
- **Private Messages (PM)**: Direct 1-on-1 communication.
- **System Log**: Broadcasts server-wide events ("A Mythical Beast has spawned in Sector 7").

## 4. Anonymity and Identity
- By default, all messages display as `[Anonymous]`.
- Players can choose to toggle their name on.
- Equipping a Title (e.g., `[Night Stalker] Qing Zhou`) reveals identity but earns respect or fear.
- Players can inspect non-anonymous names to see basic public stats (Level, Title, Guild), but exact coordinates and inventory are hidden.

## 5. Death Notices
- When a player (real or simulated) dies, a death notice is broadcast to World Chat. 
- High-level deaths include coordinates. Other players can race to those coordinates to loot the wreck.

## 6. Edge Cases
- **Spam/Toxicity (Multiplayer)**: Implement standard moderation filters. If a player is muted, they can still read chat but cannot participate or use Trade Chat.
- **AI Hallucinations**: Simulated chat must be grounded in the game's actual rules (e.g., an AI shouldn't brag about finding a "Blue" chest, since Blue is not a valid rarity tier).

## 7. Dependencies
- Relies on: `economy_trading`, `achievements_titles`.

## 8. Persistence Requirements
- Chat history is ephemeral, holding only the last 100 messages to save database space, except for Private Messages which are saved permanently.
