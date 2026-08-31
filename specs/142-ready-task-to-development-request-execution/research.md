# Research: Ready Task to Development Request Execution Bridge

## Decision: Compose existing Spec 141 and Spec 138 services

**Rationale**: The repository already has a project-scoped backlog service, development request draft creation, durable requirements artifact content/path generation, ADOS preparation, trusted execution, run status derivation, and browser session persistence. A focused bridge can orchestrate these without duplicating state machines.

**Alternatives considered**: Creating a second backlog execution model was rejected because it would duplicate Spec 141. Creating a new subprocess launcher was rejected because Spec 138 already defines the trusted execution path.

## Decision: Persist association on backlog tasks and existing project-keyed execution collections

**Rationale**: Backlog tasks already carry optional development request and execution run ids, and browser session persistence already saves backlog collections and ADOS collections by project. Extending the task metadata with preparation/source fields keeps reload recovery deterministic.

**Alternatives considered**: Looking up the latest project run was rejected because it violates project isolation and duplicate protection.

## Decision: Put untrusted task text only in durable request/artifact content and provider file payload

**Rationale**: Existing trusted ADOS execution passes a stable command/config and a requirements file payload. Task text can be preserved in the durable artifact while avoiding raw shell argument interpolation.

**Alternatives considered**: Passing task text through command arguments or prompt text was rejected because backlog content is untrusted operator input.

## Decision: Keep completion synchronization conservative

**Rationale**: Request creation and preparation are not execution completion. The implementation should expose associated real run state and only move planning to in-progress after accepted execution. Automatic completed-state mutation is allowed only when derived from the associated real run.

**Alternatives considered**: Marking completed after request creation or preparation was rejected as false state.
