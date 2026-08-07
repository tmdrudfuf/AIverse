# Research: Review Fix Plan Foundation

## Decision: Place Spec 080 between Review Fix Request and future fix execution

**Rationale**: Spec 079 records human intent to request fixes but intentionally stops before execution. The smallest next roadmap boundary is an immutable plan snapshot that describes the exact current fix context without starting Codex, Claude, Validation Runtime, or repository mutation.

**Alternatives considered**:

- Start a fix runtime immediately: rejected because the user explicitly requires no automatic fix execution and no subprocess execution.
- Reuse Review Fix Request as the plan: rejected because request and plan answer different questions; the request captures intent, while the plan captures executable context for a later boundary.

## Decision: Revalidate by calling the Review Fix Request service

**Rationale**: The request service already centralizes human actor validation, Review Decision classification, Runtime Chain Integrity, exact-context binding, and stale-state behavior. Reusing it prevents a parallel validator from drifting.

**Alternatives considered**:

- Duplicate Review Decision and chain checks in the plan service: rejected as a second validation architecture.
- Trust stored request records: rejected because command-time revalidation is required.

## Decision: Keep plan records immutable and per-project

**Rationale**: Existing Specs 067-079 use immutable snapshots and per-project collections. Matching that pattern preserves project isolation and makes idempotency straightforward.

**Alternatives considered**:

- Global singleton current plan: rejected because matching raw IDs across projects must not collide.
- Mutating the request record with plan state: rejected because Spec 079 records are historical and immutable.

## Decision: Use KeyG for explicit plan action

**Rationale**: KeyF is already used for Request Review Fix. KeyG is adjacent, available in the current input controller, and can be routed as a distinct one-transition-per-input action.

**Alternatives considered**:

- Reuse KeyF: rejected because one input event must not request and plan fixes.
- Use Enter: rejected because Enter already participates in promotion/approval/prepare/start chains.
