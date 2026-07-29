# Research: Assigned Task Work Session Preparation Foundation

## Decision: Use a Separate Prepared-Session Domain

**Rationale**: Existing `WorkSession` status values (`queued`, `running`, `finished`, `failed`, `cancelled`) are execution-oriented. A preparation record must not be mistaken for an active or queued executable session.

**Alternatives considered**:
- Add `prepared` to `WorkSessionStatus`: rejected because it blurs active execution and preparation in the current service/provider.
- Store only a controller flag: rejected because the feature requires immutable records, results, IDs, and provenance.

## Decision: Keep Confirmed Assignment Records Immutable

**Rationale**: Spec 067 records are historical proof of human assignment confirmation. Preparation is a later boundary and should be represented by new records rather than rewriting assignment flags such as `workSessionCreated`.

**Alternatives considered**:
- Mutate `workSessionCreated`: rejected because the phrase implies active session creation.
- Add `sessionPrepared` to assignment records: rejected for this foundation because it duplicates state and weakens immutability.

## Decision: Deterministic ID from Project, Task, Assignment, and Ruleset

**Rationale**: Idempotency and duplicate prevention require stable identity independent of timestamps, display names, or row order.

**Alternatives considered**:
- Timestamp IDs: rejected as nondeterministic.
- Task-only IDs: rejected because confirmed assignment provenance is central to the boundary.

## Decision: Synchronous Local Service

**Rationale**: All required inputs already exist in memory. No network, provider, subprocess, or scheduler is needed.

**Alternatives considered**:
- Use `WorkSessionService`: rejected because it invokes a provider and creates active/running sessions.

## Decision: Low-Priority Dashboard Rows

**Rationale**: Preparation is advisory/pre-execution state and should not displace issue details, active task rows, candidate tasks, assignment recommendations, promotion rows, or confirmed assignment rows.

**Alternatives considered**:
- Add a top-panel status: rejected because it overstates preparation importance.
