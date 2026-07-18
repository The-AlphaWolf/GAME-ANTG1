# Achievements and Titles System

## 1. Purpose
Reward the player for extraordinary feats, exploration, and milestones. Titles provide permanent, global buffs to the player.

## 2. Responsibilities
- Monitor game state for achievement triggers.
- Grant Titles upon achievement completion.
- Apply active Title buffs to the player.

## 3. Achievements
Hidden or public goals. (e.g., "First Blood: Kill your first monster", "Hoarder: Amass 100,000 EC", "Madman: Survive 48 hours with 0 Sanity").

## 4. Titles
When a significant achievement is unlocked, it grants a Title.
- **Equipping**: The player can equip ONE Title at a time. The equipped title provides a massive buff and is displayed next to their name in World Chat.
- **Passive Collection**: Simply owning a Title (even when unequipped) grants a tiny, permanent +1% micro-buff to a specific stat. 
- **Examples**:
  - *Title: "Night Stalker"* (Equipped: +50% damage at night. Passive: +1% Agility).
  - *Title: "The One-Percent"* (Equipped: Trade prices reduced by 40%. Passive: +1% Charm).

## 5. First-Server Achievements
- Global achievements that can only be unlocked by the *first* player on the server to accomplish them (e.g., "First to kill a Gold Boss").
- Grants a server-unique Mythical Title.
- Broadcasts a server-wide announcement in World Chat.

## 6. Edge Cases
- **Stat Recalculation**: When a title is swapped, the system must immediately recalculate max stats (Health, Carry Weight) and adjust current values accordingly so the player doesn't instantly die or drop items.
- **Retroactive Triggers**: If a new achievement is added in a patch, the system should scan player stats/inventory upon login and grant it retroactively if conditions are already met.

## 7. Dependencies
- Relies on: `player_stats`, `chat_systems`.

## 8. Persistence Requirements
- Save `UnlockedAchievements` (Array of IDs) and `UnlockedTitles` (Array of IDs).
- Save `EquippedTitleID`.
