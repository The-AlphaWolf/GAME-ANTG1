# Interactive Survival Road RPG - Game Design Repository

Welcome to the central repository for the Interactive Survival Road RPG. This repository serves as the **Single Source of Truth** for the entire 50-person engineering team.

This project is in the Pre-Production phase. **No implementation code exists in this repository.** Instead, this repository contains the complete, uncompromising specification of every mechanic, system, API, data model, and architectural pattern required to build the game.

## Table of Contents

### 1. Game Design - Core Mechanics
*The foundational rules of player survival and existence.*
- [Player Stats System](docs/game_design/core/player_stats.md)
- [Rarity System](docs/game_design/core/rarity_system.md)
- [Inventory System](docs/game_design/core/inventory_system.md)
- [Time & Weather System](docs/game_design/core/time_weather.md)

### 2. Game Design - Active Mechanics
*How the player interacts with the world.*
- [Combat System](docs/game_design/mechanics/combat_system.md)
- [Crafting System](docs/game_design/mechanics/crafting_system.md)
- [Exploration System](docs/game_design/mechanics/exploration.md)
- [Economy & Trading](docs/game_design/mechanics/economy_trading.md)

### 3. Game Design - Entities
*The living (and undead) actors in the world.*
- [NPC AI System](docs/game_design/entities/npc_ai.md)
- [Relationship System](docs/game_design/entities/relationship_system.md)
- [Monster AI & Bosses](docs/game_design/entities/monster_ai.md)
- [Loot Tables](docs/game_design/entities/loot_tables.md)

### 4. Game Design - Vehicle System
*The core mobile base and its complex evolution.*
- [Vehicle Core System](docs/game_design/vehicle/vehicle_core.md)
- [Vehicle Evolution Paths](docs/game_design/vehicle/vehicle_evolution.md)
- [Vehicle Levels & Milestones](docs/game_design/vehicle/vehicle_levels.md)

### 5. Game Design - Progression
*How the player grows in power and standing.*
- [Primary Talent (SSS Mythical Upgrade)](docs/game_design/progression/primary_talent.md)
- [Secondary Talents](docs/game_design/progression/secondary_talents.md)
- [Quest System](docs/game_design/progression/quest_system.md)
- [Achievements & Titles](docs/game_design/progression/achievements_titles.md)

### 6. Game Design - Social
*Multiplayer and communication systems.*
- [Chat Systems](docs/game_design/social/chat_systems.md)
- [Guild System (Post-Day 7 Expansion)](docs/game_design/social/guilds.md)

### 7. Architecture
*The backend engines powering the RPG.*
- [AI Orchestration System](docs/architecture/ai_orchestration.md)
- [Save System & Persistence](docs/architecture/save_system.md)
- [Networking Strategy](docs/architecture/networking.md)
- [Security & Anti-Cheat](docs/architecture/security_anti_cheat.md)
- [Performance Budget](docs/architecture/performance_budget.md)
- [Deployment Strategy](docs/architecture/deployment_strategy.md)

### 8. Database Design
*The event-sourced read projections.*
- [Player Schema](docs/database/schema_player.md)
- [Vehicle Schema](docs/database/schema_vehicle.md)
- [World Schema](docs/database/schema_world.md)
- [Database Architecture](docs/database/database_architecture.md)

### 9. API Contracts
*Client-Server communication definitions.*
- [API Contracts Master](docs/api/api_contracts.md)
- [Game Loop API](docs/api/game_loop_api.md)
- [Social API](docs/api/social_api.md)
- [AI Integration API](docs/api/ai_integration_api.md)

### 10. UI Design
*Interface layouts and interactions.*
- [HUD Design](docs/ui/hud_design.md)
- [Vehicle Panels](docs/ui/vehicle_panels.md)
- [Inventory Screens](docs/ui/inventory_screens.md)
- [Interaction Flows](docs/ui/interaction_flows.md)

### 11. Engineering Standards
*How we write code.*
- [Engineering Guidelines](docs/standards/engineering_guidelines.md)
- [Coding Standards](docs/standards/coding_standards.md)
- [Testing Pyramid](docs/standards/testing_pyramid.md)
- [Observability & Analytics](docs/standards/observability.md)

---

## Mission Statement
Our objective is to execute the **Interactive Survival Road RPG** exactly as defined in these documents. Every PR must reference these specifications. If a design ambiguity is discovered during implementation, the engineer must bring it to the Technical Director to resolve and update the relevant markdown file *before* writing the code.
