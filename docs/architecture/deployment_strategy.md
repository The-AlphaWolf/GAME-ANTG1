# Deployment Strategy and CI/CD

## 1. Purpose
Outline how the repository is built, tested, and deployed to production environments without causing downtime for players.

## 2. Environments
- **Local/Dev**: Developer machines. Uses mocked LLM responses to avoid racking up API costs during unit testing.
- **Staging**: A mirror of production. Connected to the actual LLM API. Used for QA and balancing tests.
- **Production**: The live game environment.

## 3. CI/CD Pipeline
- **Continuous Integration (CI)**:
  - Triggered on PR creation against the `main` branch.
  - Runs linters, static analysis, and the unit test suite.
  - Validates all JSON schemas and ensures markdown documentation is formatted correctly.
- **Continuous Deployment (CD)**:
  - Triggered on merge to `main` (for backend) or tagged releases (for clients).
  - Uses containerization (Docker) to deploy backend services to a Kubernetes cluster.

## 4. Zero-Downtime Deployments
- Use Blue/Green deployments for backend services.
- The `Event Replayer` handles database migrations in the background. Old clients connect to the Blue cluster, new clients connect to the Green cluster. State is synchronized via the central database.

## 5. Hotfixes
- Emergency patches can bypass the standard staging phase but MUST pass the automated CI suite.
- Game configuration values (e.g., adjusting the drop rate of a Mythical chest) must be hot-reloadable without restarting the server, loaded from a central config service or environment variables.

## 6. Developer Notes
- Ensure all AI Prompts are version-controlled alongside code. If a prompt changes, it triggers the deployment pipeline.

## 7. Dependencies
- Relies on: `engineering_guidelines`, `testing_pyramid`.
