# Guild System (Future Expansion)

## 1. Purpose
Provide a framework for post-Novice Period cooperative play, allowing players to form massive convoys, share resources, and conquer territory.

## 2. Responsibilities
- Manage guild creation, hierarchy, and member limits.
- Govern Guild Wars and convoy mechanics.

## 3. Guild Mechanics
- **Creation**: Requires a Gold-tier item `Guild Token` (dropped by Bosses post-Day 7) and a large amount of Energy Credits.
- **Hierarchy**: Leader -> Officers -> Members -> Recruits.
- **Convoy System**: Guild members can physically link their vehicles or travel in a synchronized pack. 
  - *Buffs*: Traveling in a convoy reduces Danger Level aggro (monsters are intimidated by numbers) but increases Fuel consumption globally due to slow pacing.

## 4. Guild Base (Mobile vs Stationary)
- Guilds can pool resources to build a stationary `Sanctuary` in ruined cities.
- Alternatively, if the Guild Leader possesses a Level 150+ `Legendary Mobile Citadel`, the vehicle itself becomes the Guild Base.

## 5. Guild Wars
- Guilds can declare war on each other for territory control (which yields passive resource generation).
- Combat involves massive vehicle-vs-vehicle battles using mounted weaponry.

## 6. Edge Cases
- **Leader Inactivity**: If a leader is offline for 14 days, leadership automatically passes to the highest-contributing Officer.
- **Friendly Fire**: Disabled between guild members unless a specific "Duel" is initiated.

## 7. Dependencies
- Relies on: `vehicle_levels`, `combat_system`.

## 8. Developer Notes
- This system is locked during the first 7 days. The UI for it should remain completely hidden or marked as "Signal Lost" until Day 8.
