# Research: Confirmed Employee Assignment Foundation

## Decision: Use a focused confirmed-assignments module

**Rationale**: Existing Spec 064, 065, and 066 modules are feature-specific siblings. A new `confirmed-assignments/` module keeps this feature separate from recommendation, promotion approval, ProjectTask creation, manual task assignment, and work sessions.

**Alternatives Considered**:

- Add logic directly to `CandidateAssignmentService`: rejected because recommendations must remain non-binding.
- Extend `CandidateProjectTaskPromotionService`: rejected because ProjectTask creation and assignment confirmation are separate human decisions.
- Use manual task assignment flow: rejected because it mutates employee status to `Working`, which this feature must not do.

## Decision: Reuse ProjectTask assignee fields only

**Rationale**: Existing `ProjectTask` has optional `assignee` and `assigneeId`. Updating these fields expresses confirmed assignment without adding a second task model.

**Constraints**: Status remains `Todo`; no work session is created; employee state is not mutated to `Working`.

## Decision: Validate Spec 066 provenance from task description

**Rationale**: Spec 066 stores Candidate Task ID, promotion decision ID, assignment recommendation ID, and a promotion marker in the ProjectTask description. Parsing this deterministic local provenance avoids adding incompatible fields to `ProjectTask`.

**Tradeoff**: Provenance is text-backed until a future persistent metadata model exists. Validation remains conservative: missing or mismatched markers block confirmation.

## Decision: Employee availability uses existing fields

**Rationale**: `Employee.status`, `assignedTaskId`, current active task assignment, and active work sessions are the available local signals. `Idle` employees with no conflict are assignable; `Working` and `Offline` are blocked.

**Tradeoff**: This avoids workload simulation. More nuanced availability is deferred.

## Decision: No reassignment support

**Rationale**: Reassignment requires additional human workflows and conflict resolution. Spec 067 only confirms the first eligible assignment.

## Decision: In-memory records/results

**Rationale**: Current Spec 064-066 foundation layers store derived state in `ProjectPortalState`. Durable persistence is explicitly deferred.

## Decision: Low-priority dashboard rows

**Rationale**: Assignment result rows are useful confirmation, but less important than issues, tasks, candidates, recommendations, and promotion review state. Appending them last preserves existing layout regressions.
