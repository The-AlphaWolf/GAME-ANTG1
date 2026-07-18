# Quest System

## 1. Purpose
Provide structure, lore, and directed goals for the player amidst the open-world sandbox survival experience.

## 2. Responsibilities
- Track active, completed, and failed quests.
- Manage quest objectives and waypoints.
- Dispense rewards upon completion.

## 3. Quest Types
- **Main Scenario**: The overarching mystery of the Survival Road. (e.g., "Reach the Coordinates at Kilometer 10,000"). These cannot be failed.
- **World Events**: Timed quests that trigger globally. (e.g., "A Merchant Caravan is under attack 5km ahead. Save them before sunset.")
- **NPC Requests**: Personal favors for NPCs to increase Trust/Affection.
- **Bounties**: Found on message boards in ruined cities; kill X monster for Y currency.

## 4. Objective Tracking
Objectives can be:
- Kill (Target, Quantity)
- Gather (ItemBaseID, Quantity)
- Deliver (ItemInstanceID, Location/NPC)
- Escort (NPC, Destination)
- Survive (Duration, Condition)

## 5. AI Integration
- The `AI Prompt Module` reads the `ActiveQuests` array. It uses this to subtly guide the player or flavor the narration. 
- Example: If a bounty for "Acid Spitters" is active, the narrator will emphasize acidic smells or tracks in the environment.

## 6. Edge Cases
- **Sequence Breaking**: If the player kills a boss before receiving the bounty for it, the system must recognize the kill retrospectively and allow instant turn-in.
- **NPC Death**: If a quest-giver dies before the player turns in the quest, the quest is marked "Failed" and moved to the archive. The system should generate a mourning/loot event at their last location.
- **Lost Quest Items**: If a critical quest item is dropped and despawns, the system must provide a fallback mechanism (e.g., the item respawns at its original location).

## 7. Dependencies
- Relies on: `inventory_system`, `npc_ai`, `combat_system`.

## 8. Persistence Requirements
- Save `ActiveQuests` (Array of objects detailing current step progress), `CompletedQuests`, and `FailedQuests`.
