# Research: Approved Candidate ProjectTask Promotion Foundation

## Decision: Reuse existing ProjectTask with `Todo` as initial status

**Rationale**: `Todo` is the existing non-started state in the local task model. It keeps promoted tasks visible without implying work started.

**Alternatives considered**:

- Add a new `Planned` status: rejected because it would broaden task status semantics beyond the smallest compatible change.
- Use `In Progress`: rejected because it implies execution.

## Decision: Keep promoted tasks unassigned

**Rationale**: Spec 064 recommendations are proposals, not accepted assignments. Leaving `assignee` and `assigneeId` unset preserves that boundary.

**Alternatives considered**:

- Set the recommended employee as assignee: rejected because that would imply accepted assignment and alter workload semantics.
- Store recommendation only in a parallel result object: rejected as insufficient traceability once users view the ProjectTask list.

## Decision: Encode provenance using deterministic ID, description, and activity note

**Rationale**: The current `ProjectTask` type has no metadata object. Deterministic ID plus bounded description/activity text preserves traceability without creating a second ProjectTask model.

**Alternatives considered**:

- Extend `ProjectTask` with metadata: deferred until durable task provenance is needed.
- Use title matching: rejected because duplicate titles are valid.

## Decision: Synchronous in-memory promotion

**Rationale**: All required inputs are already in controller state. Synchronous promotion avoids unnecessary async race handling while preserving project isolation.

**Alternatives considered**:

- Add provider writes or persistence: out of scope.
- Add background promotion jobs: out of scope and unsafe for explicit human gating.
