# Data Model: Assigned Task Work Session Preparation Foundation

## PreparedWorkSessionRecord

Represents one immutable local preparation record for a confirmed assignment.

Fields:
- `id`: deterministic prepared-session ID.
- `projectId`: owning project.
- `projectTaskId`: existing ProjectTask ID.
- `candidateTaskId`: originating Candidate Task ID when present.
- `confirmedAssignmentId`: Spec 067 assignment record ID.
- `assignmentRecommendationId`: recommendation provenance when present.
- `promotionDecisionId`: promotion provenance when present.
- `employeeId`: canonical employee identity.
- `employeeDisplayName`: display-name snapshot.
- `status`: `Prepared` or `AlreadyPrepared` for stored successful records.
- `preparationSource`: `Human`.
- `reasonCodes`: preparation reason codes.
- `preparedAt`: timestamp supplied by the explicit command.
- `rulesetVersion`: `prepared-session-v1`.
- `taskStatusAtPreparation`: expected to be Todo.
- `assignmentProvenance`: copied from confirmed assignment.
- `taskProvenance`: copied promoted-task provenance.
- `humanPrepared`: true.
- `workStarted`, `active`, `paused`, `completed`, `executionStarted`, `agentStarted`, `repositoryMutationStarted`, `githubMutationStarted`: all false.

Validation:
- Must reference one known confirmed assignment and matching task/employee.
- Must not imply work started or active execution.
- Must be copied defensively when returned.

## PreparedWorkSessionResult

Represents the outcome of one preparation command.

Statuses:
- `Prepared`
- `AlreadyPrepared`
- `Ineligible`
- `Unavailable`
- `Conflict`
- `Failed`

Fields:
- `id`: deterministic result ID.
- `projectId`
- `projectTaskId`
- `confirmedAssignmentId`
- `employeeId`
- `preparedSessionId`
- `status`
- `reasonCodes`
- `prepared`
- `duplicateExistingPreparation`
- `humanPrepared`
- `active`, `workStarted`, `executionStarted`, `employeeMoved`, `repositoryMutationStarted`, `githubMutationStarted`: all false.
- `resultAt`
- `rulesetVersion`

## PreparedWorkSessionResultCollection

Project-scoped immutable collection.

Fields:
- `projectId`
- `results`
- `resultCount`
- `generatedAt`
- `rulesetVersion`

## State Transitions

Valid:
- No prepared session -> `Prepared`
- Existing prepared session for same confirmed assignment -> `AlreadyPrepared`

Blocked:
- Missing, stale, conflicting, active, started, completed, or project-mismatched inputs -> safe non-mutating result.

Out of scope:
- Prepared -> active session.
- Prepared -> cancelled.
- Prepared -> reassigned.
