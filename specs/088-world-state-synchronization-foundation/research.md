# Research: Spec 088 - World State Synchronization Foundation

## Decision: Start with an in-memory read model

**Rationale**: The current app already keeps city/office state in memory. A durable store or transport would expand the blast radius and contradict the feature boundary.

**Alternatives considered**: Persist snapshots immediately; add a React global store; stream scene state over a real-time channel. Rejected because persistence and transport decisions are still open in `docs/architecture.md`.

## Decision: Synchronize semantic world facts, not frame-level navigation state

**Rationale**: Architecture decisions explicitly keep camera velocity and input intent runtime-local while reserving durable world state for shared facts such as world identity, buildings, actors, and locations.

**Alternatives considered**: Include all camera and input state; synchronize only static config. Rejected because frame-level state is noisy, while static-only state would miss the Founder position.

## Decision: Use copied plain TypeScript snapshots

**Rationale**: Existing feature foundations use plain TypeScript models and services with defensive copies. This keeps Phaser rendering separate from source-of-truth state and makes tests straightforward.

**Alternatives considered**: ECS, Redux-style store, Phaser data manager. Rejected as premature or too coupled to rendering.

## Decision: Reuse the existing synchronization lifecycle vocabulary

**Rationale**: Repository and issue synchronization already use explicit status values. Matching that shape makes later UI and error handling predictable without coupling world state to repository state.

**Alternatives considered**: Boolean `synced` flags; inferred state from available fields. Rejected because booleans cannot distinguish not-started, syncing, failed, and unavailable states.
