# Relationship System

## 1. Purpose
Quantify and manage the social dynamics, trust, and romance between the player and NPCs.

## 2. Responsibilities
- Track three main relationship axes: Trust, Respect, and Affection.
- Alter NPC behavior based on these axes.
- Govern the natural development of romance.

## 3. The Three Axes (-100 to +100)
- **Trust**: 
  - *Low*: NPC suspects player will betray them. Won't trade valuable items. 
  - *High*: NPC shares secrets, turns their back to the player, offers loans.
- **Respect**:
  - *Low*: NPC insults the player, ignores their advice.
  - *High*: NPC defers to player's tactical decisions, follows orders in combat.
- **Affection**:
  - *Low*: Apathy or disgust.
  - *High*: Deep friendship or romance.

## 4. Romance Mechanics
- Romance cannot be forced instantly via high stats (e.g., maxing Charm).
- It requires a combination of high Affection, high Trust, and specific shared experiences (e.g., surviving a Boss fight together, saving their life).
- The AI Prompt must naturally weave romantic subtext into dialogue only when the thresholds are met.

## 5. Interactions & Modifiers
- **Gifts**: Giving an item the NPC 'Likes' increases Affection.
- **Betrayal**: Leaving an NPC to die in combat plummets Trust and Respect.
- **Dialogue Choices**: The AI parses the player's custom text inputs to determine the shift in the three axes. (e.g., Acting cowardly lowers Respect; healing the NPC increases Trust).

## 6. Edge Cases
- **Conflicting Axes**: High Affection but Low Trust results in a "tragic/toxic" dynamic where the NPC loves the player but expects to be betrayed. The AI Prompt must understand this nuance.
- **Jealousy**: If traveling with multiple NPCs, raising Affection with one may lower it with another, depending on their personalities.

## 7. Dependencies
- Relies on: `npc_ai`, `player_stats` (Charm).

## 8. Persistence Requirements
- The three axes are stored as integers (-100 to 100) within the NPC's data structure in the save file.
