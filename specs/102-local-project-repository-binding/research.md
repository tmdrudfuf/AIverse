# Research: Local Project Repository Binding

## Decision: Treat binding as configured metadata, not verified repository state

**Rationale**: Specs 060 and 061 deliberately separate configured repository identity from verified synchronization. The browser app cannot safely read local git state, so this feature only records operator-provided local paths and branch/spec metadata.

**Alternatives considered**: A local git reader was rejected because it would require filesystem or subprocess access in `src/`. Hardcoding machine-specific paths in seed data was rejected because source should remain reusable.

## Decision: Implement binding as a pure registry transformation

**Rationale**: A pure function can update registry entries deterministically, return per-binding results, and be tested without controller or UI coupling. It also avoids hidden global configuration.

**Alternatives considered**: Adding a portal UI was rejected as larger than the handoff scope. Mutating `ProjectRegistryService` state directly without a result object was rejected because rejected bindings need explicit feedback.

## Decision: Accept bindings through `createProjectPortalState` options

**Rationale**: State creation is the point where registry entries become player-visible projects. Optional parameters give tests and future bootstrapping code a stable integration point without adding persistence or environment loading.

**Alternatives considered**: Environment-variable loading was deferred because it adds build/runtime semantics and is not required to prove the binding model.
