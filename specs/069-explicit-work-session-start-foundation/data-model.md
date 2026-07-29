# Data Model: Explicit Work Session Start Foundation

## ActiveWorkSessionRecord

Represents one locally active, not-executing work session created from one prepared session.

Fields:

- `id`: deterministic active-session identifier.
- `projectId`: owning project.
- `projectTaskId`: ProjectTask being worked.
- `preparedSessionId`: Spec 068 prepared-session provenance.
- `confirmedAssignmentId`: Spec 067 confirmed-assignment provenance.
- `candidateTaskId`: optional Candidate Task provenance.
- `assignmentRecommendationId`: optional Spec 064 recommendation provenance.
- `promotionDecisionId`: optional Spec 065 decision provenance.
- `employeeId`: canonical employee identity.
- `employeeDisplayName`: display snapshot.
- `provider`: existing WorkSession provider value, initially `placeholder`.
- `status`: existing WorkSession status, initially `running`.
- `startSource`: `Human`.
- `reasonCodes`: start reason codes.
- `startedAt`: command timestamp.
- `rulesetVersion`: `active-session-v1`.
- `taskStatusAtStart`: task status snapshot before transition.
- `assignmentProvenance`: copied recommendation provenance.
- `preparationProvenance`: copied prepared-session provenance summary.
- `humanStarted`: true.
- `active`: true.
- `workStarted`: true.
- `paused`: false.
- `completed`: false.
- `executionStarted`: false.
- `agentStarted`: false.
- `repositoryMutationStarted`: false.
- `githubMutationStarted`: false.

Validation:

- ID must match project/task/prepared-session/ruleset identity.
- Project, task, employee, confirmed assignment, and prepared-session IDs must match all inputs.
- Execution and mutation flags must remain false.

## WorkSessionStartResult

Represents the outcome of one explicit start command.

Fields:

- `id`: deterministic result identifier.
- `projectId`
- `projectTaskId`
- `preparedSessionId`
- `confirmedAssignmentId`
- `employeeId`
- `employeeDisplayName`
- `activeSessionId`
- `status`: `Started`, `AlreadyStarted`, `Ineligible`, `Unavailable`, `Conflict`, or `Failed`.
- `reasonCodes`: safe reason-code list.
- `started`: boolean.
- `duplicateExistingSession`: boolean.
- `humanStarted`: boolean.
- `active`: boolean.
- `workStarted`: boolean.
- `executionStarted`: false.
- `agentStarted`: false.
- `employeeMoved`: false.
- `repositoryMutationStarted`: false.
- `githubMutationStarted`: false.
- `resultAt`: command timestamp.
- `rulesetVersion`: `active-session-v1`.

Validation:

- Successful results must include an active-session ID.
- Failed or blocked results must not claim work started.
- Reason arrays are defensively copied.

## WorkSessionStartResultCollection

Project-scoped result list for dashboard display.

Fields:

- `projectId`
- `results`
- `resultCount`
- `generatedAt`
- `rulesetVersion`

Validation:

- Results belong to the same project.
- Ordering remains deterministic by insertion order from explicit commands.

## State Transitions

Prepared:

```text
PreparedWorkSessionRecord(active=false, workStarted=false)
```

Started:

```text
ActiveWorkSessionRecord(active=true, workStarted=true, executionStarted=false)
ProjectTask(Todo -> In Progress)
Employee(Idle -> Working)
```

Repeated valid start:

```text
AlreadyStarted
```

Invalid current state:

```text
Ineligible / Unavailable / Conflict / Failed
```

No invalid transition may partially mutate task, employee, prepared session, confirmed assignment, repository, or GitHub state.
