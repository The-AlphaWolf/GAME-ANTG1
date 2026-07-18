# Vehicle Panels Design

## 1. Purpose
Define the UI for interacting with the core progression mechanic: The Vehicle. This interface must feel like a mechanic's diagnostic screen or a high-tech blueprint.

## 2. The "Garage" View
Accessible when the player chooses to "Inspect Vehicle" during downtime.

### Component Diagnostic Screen
- A wireframe or stylized top-down rendering of the vehicle class (e.g., Van, Fortress).
- Clickable nodes on the vehicle map to the 12 active components.
- Clicking a node opens a modal detailing:
  - Durability (with a "Repair" button).
  - Current Rarity.
  - Apply Upgrade Talent (Button, disabled if 0 charges or already upgraded).

### Evolution Tech Tree Screen
- A sprawling skill-tree UI showing the 15 paths.
- Paths that the player has chosen to lock out (the 3 omitted paths) are grayed out with a red padlock and cannot be interacted with.
- Active paths show current level and branching choices.
- **Confirmation Flow**: When selecting an evolution branch, a severe warning popup must appear: "WARNING: Selecting [Cryo-Pod] permanently locks out [Surgical Suite]. Confirm?"

## 3. Visual Language
- The UI should have a slightly gritty, utilitarian aesthetic early on (green phosphor, CRT scanlines).
- As the vehicle levels up to Fortress/Citadel, the UI aesthetic should automatically upgrade to sleek holographics and clean lines to reflect the technological leap.

## 4. Mobile Interactions
- Pinch-to-zoom on the Evolution Tech Tree.
- Swipe between Component Diagnostics and Tech Tree.
