# Research: Repository Fixture Playground

## Decision: Enhance the existing mock repository provider instead of adding a fixture selector UI

**Rationale**: The app already routes repository data through `GitHubRepositoryService`, `MockGitHubRepositoryProvider`, Company Dashboard source signals, and Project Dashboard source metadata. Enriching that provider proves the dashboard/source flow with the smallest behavior change.

**Alternatives considered**:

- **Selectable fixture scenario UI**: Rejected for this slice because it would add player-facing controls and dashboard workflow decisions beyond the stated local/mock provider goal.
- **Standalone developer playground screen**: Rejected because the current acceptance criteria can be verified through existing dashboard surfaces and focused tests.
- **New generic provider framework**: Rejected because provider-neutral contracts already exist and a generic framework would be speculative.

## Decision: Keep issue and pull request data summary-level

**Rationale**: `GitHubRepositorySummary` and `GitHubRepositorySnapshot` currently model issue and pull request summaries rather than detailed issue/PR lists. Summary-level fixture data is enough to prove source signals, project health, checks, activity, freshness, and future read-integration shape.

**Alternatives considered**:

- **Add detailed issue/PR item arrays**: Deferred because it would expand types and UI without a current detail surface.
- **Keep only counts with no status variety**: Rejected because it would not prove stale, failing, unavailable, and activity scenarios.

## Decision: Use deterministic local timestamps and display-safe fake repository data

**Rationale**: The fixture must be stable under test and must not imply real GitHub access. Fixed fake owners, repositories, commit SHAs, timestamps, source statuses, and check labels make output deterministic.

**Alternatives considered**:

- **Current date/time generation**: Rejected because it would make tests brittle and undermine deterministic read-model behavior.
- **Randomized fixture variation**: Rejected because repeatability is more important than breadth for this foundation.

## Decision: Preserve Project Advisory Signal source separation

**Rationale**: Spec 034 established that advisory data comes from local project-manager suggestions. Repository fixtures should enrich source/health/activity metadata without fabricating advisory recommendations.

**Alternatives considered**:

- **Derive advisory text from repository risks**: Rejected because it would violate advisory source boundaries and create hidden behavior coupling.
