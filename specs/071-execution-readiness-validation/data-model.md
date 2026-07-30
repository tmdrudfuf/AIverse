# Data Model: Execution Readiness Validation Foundation

## ExecutionReadiness

Immutable snapshot representing one readiness evaluation for one Execution Plan.

Fields:

- `readinessId`: deterministic readiness identity.
- `projectId`: owning project.
- `executionPlanId`: evaluated Execution Plan.
- `activeSessionId`: source active session from plan.
- `projectTaskId`: source task from plan.
- `confirmedAssignmentId`: source confirmed assignment from plan.
- `preparedSessionId`: source prepared session from plan.
- `employeeId`: source employee from plan.
- `repositoryId`: source repository from plan.
- `status`: `Ready`, `Blocked`, or `Failed`.
- `checks`: immutable list of readiness checks.
- `evaluatedAt`: evaluation timestamp supplied by command.
- `rulesVersion`: readiness rules version.
- `executionApproved`: fixed `false`.
- `executionStarted`: fixed `false`.
- `agentStarted`: fixed `false`.
- `repositoryMutationStarted`: fixed `false`.
- `githubMutationStarted`: fixed `false`.

Validation:

- Identity must match `<projectId>:execution-readiness:<executionPlanId>:readiness-v1`.
- All safety flags remain false.
- Checks must include all required categories for completed evaluations.

## ExecutionReadinessResult

Immutable command result for dashboard and controller state.

Fields:

- `id`: deterministic result identity.
- `readinessId`: readiness snapshot identity when available.
- `projectId`
- `executionPlanId`
- `status`: `Ready`, `Blocked`, or `Failed`.
- `reasonCodes`: deterministic reasons.
- `passedCheckCount`
- `blockedCheckCount`
- `failedCheckCount`
- `primaryReason`
- `evaluatedAt`
- `rulesVersion`
- fixed false safety flags.

## ExecutionReadinessCheck

Individual check row.

Fields:

- `checkId`: deterministic ID based on readiness ID and category.
- `category`: stable category such as `ExecutionPlan`, `ProjectTask`, `RepositoryEvidence`, or `MutationScope`.
- `status`: `Passed`, `Blocked`, or `Failed`.
- `reason`: deterministic reason code.
- `message`: display-safe deterministic text.

## ExecutionReadinessCollection

Project-scoped immutable readiness snapshots.

Fields:

- `projectId`
- `readiness`
- `readinessCount`
- `generatedAt`
- `rulesVersion`

## ExecutionReadinessResultCollection

Project-scoped immutable readiness command results.

Fields:

- `projectId`
- `results`
- `resultCount`
- `generatedAt`
- `rulesVersion`

## Relationships

- One Execution Plan may have multiple readiness evaluations over time.
- Each readiness evaluation references one Execution Plan and current project-side source state.
- Readiness never mutates the Execution Plan, task, assignment, prepared session, active session, employee, repository metadata, or GitHub state.
