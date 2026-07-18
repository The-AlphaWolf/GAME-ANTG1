# AI Orchestration System

## 1. Purpose
Define the architecture that powers the core Interactive Text RPG experience. This system manages prompts, memory, and state validation between the player's choices and the LLM engine.

## 2. Architecture Overview
The system does not use one massive monolithic prompt. It utilizes a `Prompt Router` to select specialized modules based on context.
- **User Input** -> **State Validator** -> **Context Retrieval** -> **Prompt Composer** -> **LLM** -> **JSON Formatter** -> **UI / Game State Update**.

## 3. Prompt Modules
Separate, specialized prompts to reduce token usage and prevent hallucination:
- `System_Core.md`: The absolute rules (Rarity tiers, 12-slot vehicle limit, no auto-resolving). Always included.
- `Module_Narration.md`: Used for travel and environmental description. Focuses on weather and sanity.
- `Module_Combat.md`: Loaded only during combat. Focuses on damage calculation, terrain, and enemy intent.
- `Module_NPC.md`: Loaded during dialogue. Includes NPC memory and relationship axes.
- `Module_Economy.md`: Loaded during trading. Includes pricing multipliers.

## 4. Memory Management (The Brain)
- **Short-Term Memory**: The last 10 conversational turns. Passed directly to the LLM.
- **Long-Term Memory (Context Retrieval)**: A vector database storing past events, NPC interactions, and major decisions.
- **Memory Compression**: Every 20 turns, a background LLM process summarizes the oldest short-term memory into a dense paragraph and pushes it to Long-Term Memory.
- **Game State JSON**: The absolute truth. The LLM does *not* remember stats via text; it receives the injected JSON state every turn.

## 5. Commentary Engine
- A sub-module that analyzes the player's last choice against the optimal choice (determined algorithmically or heuristically).
- Injects the "brutal, jeering, or praising" commentary into the final output.

## 6. Edge Cases & Failure Cases
- **LLM Hallucination**: If the LLM output describes an item the player doesn't have, the `State Validator` intercepts the response, triggers a silent retry, and forces the LLM to adhere to the strict JSON inventory.
- **Timeout/Failure**: If the LLM API times out, the game falls back to a deterministic "Resting" event, saving state and notifying the player of a "Temporal Anomaly".

## 7. Dependencies
- Connects the entire repository to the user interface. Relies heavily on `game_loop_api`.
