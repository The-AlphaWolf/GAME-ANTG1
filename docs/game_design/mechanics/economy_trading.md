# Economy and Trading System

## 1. Purpose
Define the systems of commerce, currency, and value exchange between the player, NPCs, and other players.

## 2. Responsibilities
- Manage the global currency (e.g., "Survival Coins" or "Energy Credits").
- Control NPC merchant inventories and pricing.
- Facilitate the Trade Chat system.
- Prevent infinite money loops (faucets vs sinks).

## 3. Currency
- **Energy Credits (EC)**: The standard digital/magical currency of the Survival Road.
- **Faucets (How to get EC)**: Selling items to NPCs, killing bosses, opening high-tier chests.
- **Sinks (How to spend EC)**: Buying rare blueprints, repairing vehicle frame damage, purchasing fuel, World Chat megaphone uses.

## 4. NPC Trading (Merchant Caravans)
- Encountered randomly during exploration.
- Inventories are generated based on the current Danger Level.
- **Pricing**: Player `Charm` stat influences buy/sell ratios. High charm reduces prices by up to 30%.
- NPCs will remember the player. If the player attacks a merchant, they will be blacklisted by the Caravan Guild (global hostility).

## 5. Trade Chat (Player to Player)
- Accessible from the UI.
- Players can list items for a specific EC price or barter for specific resources.
- During the Novice Period (Days 1-7), items purchased via Trade Chat are teleported directly to the player's inventory via the System.
- Imposes a 5% transaction tax to act as a currency sink.

## 6. Valuations & Rarity
- Common: Base value (e.g., 10 EC).
- Uncommon: 5x Common.
- Silver: 25x Common.
- Gold: 100x Common.
- Orange: 1000x Common.
- Purple/Black/Red/Mythical: Generally considered priceless; NPCs may not have enough currency to buy them, forcing barter.

## 7. Edge Cases
- **Scams**: In Trade Chat, other "players" (simulated by AI if single-player, or real players) might attempt to scam. The system must allow this to happen natively, encouraging player vigilance.
- **Inflation**: Ensure that monster drops do not continuously drop raw currency. Currency should mostly come from selling items to keep the economy item-backed.

## 8. Dependencies
- Relies on: `inventory_system`, `chat_systems`, `npc_ai`.

## 9. Persistence Requirements
- Wallet balance is saved in the player's save file. Trade Chat listings must be saved in a global database if asynchronous multiplayer is implemented.
