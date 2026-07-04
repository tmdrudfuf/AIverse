# Research: GitHub Project Integration System

## Decision: Keep the First Slice Read-Only

**Rationale**: AIverse is currently in the Observe and Understand stages for external project data. Repository mutation would introduce security, trust, and product risks before the player has a stable observation layer.

**Alternatives considered**:

- Add issue creation or task sync immediately: rejected because it mutates external project state.
- Add autonomous AI employee commits: rejected because it belongs to a later, explicitly approved autonomous work feature.
- Add branch or PR workflows: rejected because write actions are out of scope.

## Decision: Extend the Existing Project Dashboard Provider Contract

**Rationale**: Spec 030 established provider-neutral project detail snapshots. GitHub should map into that structure so the UI remains source-agnostic and internal simulation remains valid.

**Alternatives considered**:

- Build a GitHub-specific dashboard UI: rejected because it couples the player-facing view to one provider.
- Replace internal simulation with GitHub data: rejected because it violates source-of-truth boundaries.
- Create a generic connector framework now: rejected as speculative beyond the GitHub vertical slice.

## Decision: Public-Only Is the Recommended First Authentication Direction

**Rationale**: Public repositories allow the feature to prove mapping and dashboard value without credential storage, token lifecycle, OAuth, or private data exposure.

**Alternatives considered**:

- User-provided personal access token: supports private repositories but requires token handling, masking, revocation, storage, and threat-model work.
- GitHub OAuth/App flow: robust but larger than the first vertical slice and requires app registration and callback/security design.
- Local encrypted token persistence: useful later but requires explicit security design.

**Status**: Requires user approval before implementation.

## Decision: Manual Refresh on Dashboard Open Is the Recommended First Refresh Model

**Rationale**: Refreshing when the Project Dashboard opens avoids background sync architecture and keeps simulation performance independent from GitHub availability.

**Alternatives considered**:

- Timed foreground polling: adds rate-limit and UI freshness complexity.
- Background sync: too large for the first slice and implies persistence/scheduler behavior.
- Webhooks: write-side infrastructure and external callback setup are out of scope.

**Status**: Requires user approval before implementation.

## Decision: Developer-Configured Mapping Is the Recommended First Repository Selection Flow

**Rationale**: A local mapping keeps the first vertical slice small and avoids building UI for repository search or authenticated picking before auth is settled.

**Alternatives considered**:

- Player-entered owner/name: faster to use but introduces validation and error UX choices.
- Authenticated repository picker: best for private repos but depends on auth/security decisions.

**Status**: Requires user approval before implementation.

## Decision: Distinguish External Source Data from Internal Simulation State

**Rationale**: GitHub source data represents repository status, not AIverse employee/task simulation state. Mapping must be visible but must not overwrite internal Project, Task, Employee AI, Schedule, Progression, Insight, or Knowledge state.

**Alternatives considered**:

- Mirror GitHub issues as AIverse tasks immediately: rejected as duplicated state and mutation-prone.
- Treat GitHub as the project source of truth: rejected because AIverse simulation remains authoritative for in-game autonomous employees.
