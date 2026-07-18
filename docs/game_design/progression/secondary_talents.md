# Secondary Talents System

## 1. Purpose
Provide long-term character progression beyond the initial SSS unique talent, allowing the player to specialize their build.

## 2. Responsibilities
- Grant new passive or active skills upon defeating high-tier enemies.
- Manage cooldowns and resource costs for secondary active talents.

## 3. Acquisition
- Secondary talents cannot be unlocked during the Novice Period (Days 1-7).
- They are exclusively acquired by landing the killing blow on Bosses, Elite Beasts, or finding hidden Skill Books in Mythical chests.

## 4. Talent Types
- **Passive Talents**: Always active. (e.g., *Beast Tracker*: +20% damage to mutated animals; *Iron Gut*: Can consume spoiled food without debuffs).
- **Active Talents**: Require Energy/Stamina to cast and have a cooldown. (e.g., *Shadow Step*: Teleport 10 meters; *Overclock*: Temporarily double vehicle engine output).

## 5. Rarity Scaling
Like all items, Talents have rarities.
- A Gold Boss drops a Gold Talent.
- A Mythical Boss drops a Mythical Talent.
- The player can theoretically use their SSS Upgrade talent on a Skill Book *before* reading it, upgrading the rarity of the resulting Secondary Talent.

## 6. Slot Limits
- The player can equip a maximum of **5 Active Talents** and **10 Passive Talents** at any given time.
- Swapping talents can only be done while resting in the vehicle's Living Space.

## 7. Edge Cases
- **Conflicting Talents**: The UI and logic must prevent equipping mutually exclusive talents (e.g., *Vampirism* (heal on melee) cannot be equipped with *Pure Light* (burns undead, disables dark magic)).
- **Upgrading Active Talents**: If an active talent is already learned, the player cannot upgrade it directly. They must find a higher-tier Skill Book to replace it.

## 8. Dependencies
- Relies on: `combat_system`, `monster_ai`, `player_stats`.

## 9. Persistence Requirements
- Save the array of `UnlockedTalents` and the currently `EquippedTalents` in the player's profile.
