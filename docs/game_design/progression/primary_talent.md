# Primary Talent System (SSS Mythical Upgrade)

## 1. Purpose
Define the core, unique mechanic granted to the player at the start of the game. This talent is the primary means of progression and survival, allowing the player to manipulate the rarity system.

## 2. Responsibilities
- Manage the daily charges (6 per day).
- Execute the 4-stage probability roll for upgrades.
- Validate target items.

## 3. The Talent: "Upgrade"
- **Rarity**: SSS Mythical Unique
- **Charges**: 6
- **Recharge**: Resets to 6 exactly at Midnight (00:00). Charges do NOT roll over.

## 4. Valid Targets
The talent can be cast on:
- Weapons
- Armor
- Treasure Chests (Unopened)
- Blueprints (Unlearned)
- Vehicle Parts (Uninstalled or Installed)
- Consumables (Food/Water/Meds)
- Equipment
- Resources (Raw materials)

*Cannot be used on:* The same item instance more than once. (Must set an `Upgraded=True` flag on the item object).

## 5. The Roll Logic
When a charge is consumed, the system executes up to 4 sequential rolls. If a roll succeeds, it immediately attempts the next roll in the sequence. The entire sequence only consumes **ONE** charge.

1. **Primary Roll**: 100% Success Chance -> Item gains +1 Rarity Tier.
2. **Secondary Roll**: 30% Success Chance -> Item gains an additional +1 Rarity Tier.
3. **Tertiary Roll**: 5% Success Chance -> Item gains an additional +1 Rarity Tier.
4. **Gacha Roll**: 0.05% Success Chance -> Item instantly skips remaining tiers and becomes **Mythical**.

*Example*: Upgrading a Common Sword.
- Primary Roll (100%): Becomes Uncommon.
- Secondary Roll (30% success): Becomes Silver.
- Tertiary Roll (Failed): Process stops.
- Final Result: 1 charge consumed. Common Sword -> Silver Sword.

## 6. Balancing & Design Philosophy
- **Do not artificially nerf this talent.**
- Balance the game through severe scarcity (materials are incredibly rare), immense danger (monsters hit extremely hard), and opportunity cost (Do I upgrade my gun to survive today, or upgrade this blueprint to secure tomorrow?).

## 7. Edge Cases
- **Reaching Max Tier**: If the target item is already Red, the Primary Roll makes it Mythical. The Secondary/Tertiary/Gacha rolls are skipped automatically.
- **Stackable Items**: If cast on a stack of resources (e.g., x10 Wood), the entire stack is upgraded simultaneously. (To prevent tedious micromanagement). 
- **Chest Upgrades**: Upgrading a chest changes its internal loot table ID to the higher tier before it is opened.

## 8. Dependencies
- Relies on: `rarity_system`, `inventory_system`, `time_weather` (midnight reset).

## 9. Persistence Requirements
- `UpgradeChargesRemaining` (Int, 0-6) saved to player profile.
- Every item instance must have a boolean `HasBeenUpgraded` saved to prevent double-dipping.
