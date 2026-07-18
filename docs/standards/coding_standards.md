# Coding Standards

## 1. Purpose
Define the architectural patterns and coding style enforced across the codebase to ensure maintainability, performance, and readability.

## 2. Architectural Patterns
- **Event-Driven Architecture**: The core game loop relies on event sourcing. Do not mutate state directly; emit an event and let the projection handlers mutate the state.
- **Dependency Injection (DI)**: Hard dependencies are forbidden. All services (e.g., `LLMService`, `DatabaseService`) must be injected to allow for mocking during tests.
- **Repository Pattern**: Abstract the database layer. The business logic (e.g., `CombatResolver`) should not contain raw SQL or ORM specifics.

## 3. Code Style Rules
- **Immutability**: Prefer immutable data structures. When the Game State is updated, return a new copy of the state object rather than mutating the existing one.
- **Fail Fast**: If a system detects an invalid state (e.g., an item with a rarity tier of 15), throw an exception immediately. Do not attempt to "silently fix" it, as this corrupts the event log.
- **No Magic Numbers**: Hardcoded values (e.g., `if (dangerLevel > 7)`) are forbidden. Use constants or configuration files (e.g., `if (dangerLevel > Config.Danger.MAX_SAFE_LEVEL)`).
- **TypeScript Specifics** (If used for Backend/Client):
  - Strict mode must be enabled (`"strict": true` in `tsconfig.json`).
  - `any` is strictly prohibited. Use `unknown` if the type is truly dynamic, and use type guards.

## 4. Code Review Checklist
Reviewers must actively look for:
- [ ] Is there a test covering this logic?
- [ ] Does this create an N+1 query problem in the database?
- [ ] Does this expose sensitive AI prompts to the client?
- [ ] Are all edge cases defined in the Game Design specs handled?

## 5. Comments and Documentation
- Code should be self-documenting through clear naming conventions.
- Use JSDoc (or equivalent) for all public interfaces and complex algorithmic functions.
- "TODO" and "FIXME" comments are not allowed in `main`. If work is deferred, create a Jira/GitHub ticket and link it.
