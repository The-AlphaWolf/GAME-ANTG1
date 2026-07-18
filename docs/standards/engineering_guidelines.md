# Engineering Guidelines

## 1. Purpose
Establish the foundational rules for how the 50-person engineering team will organize, build, and maintain the repository.

## 2. Folder and File Naming
- **Folders**: `snake_case`. (e.g., `game_design`, `api_handlers`).
- **Files**: `snake_case` with standard extensions. (e.g., `combat_system.md`, `player_model.ts`).
- **Classes/Interfaces**: `PascalCase`. (e.g., `VehicleEvolver`, `IPlayerState`).
- **Variables/Methods**: `camelCase`. (e.g., `currentHealth`, `calculateDamage()`).

## 3. Branching Strategy (GitFlow)
- `main`: Production-ready code. Only modified via PRs.
- `staging`: The pre-production testing environment.
- `feature/[ticket-id]-[short-desc]`: For new mechanics (e.g., `feature/SR-102-hover-fortress`).
- `bugfix/[ticket-id]-[short-desc]`: For non-critical bug fixes.
- `hotfix/[ticket-id]-[short-desc]`: For critical, production-breaking bugs. Merges directly to `main` and backports to `staging`.

## 4. Commit Style
We enforce **Conventional Commits**:
- `feat: added guild convoy mechanics`
- `fix: resolved negative fuel bug during sandstorms`
- `docs: updated rarity system specifications`
- `refactor: optimized event-sourcing replayer`

## 5. Pull Request (PR) Process
1. Developer opens a PR from their `feature` branch into `staging`.
2. The PR must fill out `.github/PULL_REQUEST_TEMPLATE.md`.
3. CI/CD runs automated tests.
4. Requires **two** approvals from Senior Engineers.
5. Code is squashed and merged.

## 6. Definition of Done (DoD)
A feature is NOT done until:
1. The code is written and peer-reviewed.
2. Unit and Integration tests are passing.
3. The Game Design documentation is updated (if mechanics changed).
4. QA has verified the feature in the staging environment.
