# HUD Design

## 1. Purpose
Define the Heads-Up Display (HUD) that the player sees during all core gameplay interactions. The HUD must present massive amounts of statistical data without overwhelming the text-based nature of the game.

## 2. Layout Architecture
- **Top Bar (World State)**:
  - Day, Time (HH:MM), Weather Icon, Temperature.
  - Location (e.g., "Highway 17, KM 500").
  - Danger Level (Visual indicator, e.g., Skull icons 1-10).
- **Left Panel (Player State - The "Vital Signs")**:
  - Health Bar (Red)
  - Energy Bar (Yellow)
  - Hunger/Thirst Indicators (Icons that pulse when < 30%)
  - Fatigue/Sanity Meters (Purple/Blue). *Note: Sanity meter should visually glitch or fade when low.*
  - Player Level and XP Bar.
- **Center Panel (The Narrative Console)**:
  - The main text block where the AI narrator describes the scene.
  - The "Commentary" sub-block (styled distinctively, perhaps italicized or in a separate colored box).
  - The 6 Action Choices (Buttons).
  - The Custom Action Text Input Field.
- **Right Panel (Quick Access)**:
  - Mini-Inventory (Equipped weapon, active armor, quick-slot consumables).
  - World Chat feed (streaming 1 line at a time).
  - Vehicle Status (Chassis health, Fuel level).

## 3. Responsive Design (Mobile)
- On mobile devices, the Left and Right panels are collapsed into "Drawers" (swipe left/right to open).
- The Top Bar is condensed.
- The Center Panel takes up 80% of the screen.

## 4. Visual Language & Rarity
- Items and stats must always respect the Rarity color coding (e.g., A Mythical item name in the HUD must shimmer with a prismatic CSS animation).

## 5. Accessibility
- High contrast mode for the narrative text.
- Option to disable UI animations (glitches, pulses).
