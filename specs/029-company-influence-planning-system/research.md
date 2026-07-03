# Research: Company Influence Planning System

## Decision: Build on the Company Dashboard and Project Portal Flow

**Rationale**: The feature starts from the dashboard experience and should feel like the first lightweight influence layer after observation and understanding. The existing Company Dashboard is already integrated with the office project portal and provider-neutral snapshot model.

**Alternatives considered**:

- Add a separate top-level UI: rejected because it would duplicate dashboard navigation and weaken the command-center model.
- Add a Phaser-world planning overlay: rejected because the feature should keep Phaser view-only and avoid movement/NPC behavior changes.

## Decision: Store Focus in Local In-Memory App State

**Rationale**: The requested slice requires deterministic local state and explicitly avoids persistence unless an existing pattern already applies. Current portal/dashboard state is the smallest likely place to keep a runtime focus selection without creating a save/load feature.

**Alternatives considered**:

- Browser storage: rejected because persistence is not required and would create broader product expectations.
- Save/load integration: rejected because save/load is a future system outside this feature.
- Provider-only derived state: rejected because the selected focus is a player choice, not a simulation-derived value.

## Decision: Add a Small Domain Service and Types

**Rationale**: A focused service keeps option definitions, default state, deterministic selection, and advisory metadata in one place. This avoids scattering focus logic through the dashboard view or controller.

**Alternatives considered**:

- Inline focus arrays in the UI: rejected because future dialogue, management, and metadata extensions would require UI refactoring.
- A new broad influence system: rejected because the feature is foundation-oriented and should not introduce full management behavior.

## Decision: Advisory Only, No Simulation Mutation

**Rationale**: The current design philosophy is Observe, Understand, Influence. This feature introduces the first influence signal but must not override autonomous employees or project execution.

**Alternatives considered**:

- Directly bias employee task choices: rejected because it mutates employee AI behavior and requires a separate gameplay decision.
- Directly speed up or reprioritize tasks: rejected because it changes project execution and introduces management mechanics.

## Decision: Extend Dashboard Data Without External Providers

**Rationale**: The Company Dashboard already uses provider-neutral data. Current focus should be surfaced there as local metadata and advisory summary, while the Internal Simulation provider remains the only implemented provider.

**Alternatives considered**:

- Add AI-generated recommendations: rejected because the feature forbids external AI/provider calls.
- Add future connector schemas now: rejected because the feature should not build future functionality before the vertical slice is complete.
