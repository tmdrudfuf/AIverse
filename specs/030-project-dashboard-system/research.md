# Research: Project Dashboard System

## Decision: Build a Provider-Neutral Project Detail Snapshot

**Rationale**: The Company Dashboard already uses provider-neutral read models. A Project Dashboard should follow the same pattern so the UI can render one selected project without depending on internal simulation details or future GitHub-specific shapes.

**Alternatives considered**:

- Render directly from internal project/task objects: rejected because it couples the UI to one data source and makes future GitHub mapping harder.
- Create GitHub-specific models now: rejected because external integration is explicitly out of scope.
- Duplicate simulation state into UI state: rejected because AIverse governance prefers exposing existing simulation state over duplicating it for presentation.

## Decision: Use Internal Simulation as the Only Current Provider

**Rationale**: The first vertical slice is read-only and internal-only. Existing Project, Task, Employee AI, Schedule, Company Progression, Company Dashboard, Company Influence, and activity/progression systems should be enough to derive useful project context.

**Alternatives considered**:

- Add a GitHub provider immediately: rejected because the feature must not implement GitHub integration yet.
- Add a generalized external connector framework: rejected as speculative expansion beyond the current slice.
- Store project detail state separately: rejected because provider derivation should remain the source of truth.

## Decision: Keep Project Inspection Read-Only

**Rationale**: The player is still moving from Observe to Understand. The Project Dashboard should not assign work, mutate tasks, alter employee AI, or provide project management controls.

**Alternatives considered**:

- Add task assignment from the detail view: rejected because it directly controls employees and project execution.
- Add issue creation or editing: rejected because it implies management and future GitHub behavior.
- Add dialogue hooks from project context: rejected because dialogue is not part of this feature.

## Decision: Include Future External Source Metadata as Optional Read Metadata

**Rationale**: A future GitHub repository should be able to map into the same Project Dashboard structure. Optional source metadata can describe the source type, source identifier, and mapping confidence without requiring external calls now.

**Alternatives considered**:

- Omit all future source metadata: rejected because the feature goal explicitly asks for a GitHub/project integration bridge.
- Add detailed GitHub repository, issue, PR, and branch fields now: rejected because it would overfit the current design to an unimplemented provider.

## Decision: Derive Project Health from Existing Signals

**Rationale**: Health, blockers, and next suggested focus should summarize current project/task/progression/employee signals without creating new operational state.

**Alternatives considered**:

- Add a persistent project health score: rejected because it creates new simulation state.
- Use only task progress: rejected because employee focus, blockers, and company focus can provide useful read-only context.
- Use AI-generated summaries: rejected because external AI/provider calls are out of scope.
