# Interaction Flows and UX

## 1. Purpose
Map out the end-to-end user experience for core game loops, ensuring the player is never confused about how to proceed or what their actions do.

## 2. Core Game Loop Flow (The Turn)
1. **Server Push**: Client receives JSON state and Narration.
2. **Render**: HUD updates stats. Narrative text types out (typewriter effect, 20ms per char).
3. **Player Evaluation**: Player reads text, checks stats.
4. **Action Selection**: 
   - Player clicks one of the 6 predefined choice buttons.
   - *OR* Player types in the Custom Action input field and presses Enter.
5. **Loading State**: UI grays out. A "Processing Reality..." spinner appears. (Handles the 1-3s LLM latency).
6. **Resolution**: Return to Step 1.

## 3. Keyboard Shortcuts (Desktop)
- `1` through `6`: Select Predefined Choices.
- `I`: Open Inventory.
- `V`: Open Vehicle Diagnostic.
- `C`: Open Chat/Social panel.
- `M`: Open Map/Exploration log.
- `Enter`: Focus Custom Action input field.

## 4. First-Time User Experience (FTUE) / Onboarding
- **Day 1, 06:00 AM**: The player wakes up in the Common Van.
- The HUD is heavily restricted. Only Health and the Narrative Console are visible.
- The AI Narrator guides the player to inspect the Van.
- As the player discovers systems (e.g., finding their first bottle of water), the Hunger/Thirst UI elements "unlock" and slide onto the screen with a tutorial tooltip.
- The SSS Mythical Talent is introduced via a guaranteed, un-failable scripted upgrade tutorial on a Common Wrench.

## 5. Death Flow
1. Health reaches 0.
2. The screen instantly turns black. No animation.
3. A single line of red text appears: "The Survival Road claims another."
4. The post-death stat screen appears (Days survived, monsters killed, final title).
5. (If playing permadeath/roguelike mode) -> Return to Main Menu.
6. (If playing persistent mode) -> Prompt to reload last Save Snapshot or await rescue.
