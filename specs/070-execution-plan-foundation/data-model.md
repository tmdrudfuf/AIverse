# Data Model: Execution Plan Foundation

## ExecutionPlan

Immutable record created from one active work session.

### Fields

- `planId`: deterministic execution-plan identifier.
- `projectId`: owning project.
- `featureId`: Spec Kit feature identifier, e.g. `070-execution-plan-foundation`.
- `projectTaskId`: existing ProjectTask ID.
- `candidateTaskId`: originating Candidate Task ID when available.
- `recommendationId`: Spec 064 assignment recommendation ID when available.
- `promotionDecisionId`: Spec 065 promotion decision ID when available.
- `confirmedAssignmentId`: Spec 067 confirmed assignment ID.
- `preparedSessionId`: Spec 068 prepared-session ID.
- `activeSessionId`: Spec 069 active WorkSession ID.
- `employeeId`: assigned employee ID.
- `repositoryId`: provider-neutral repository identifier.
- `repositoryPath`: local repository path captured as plan data.
- `worktreePath`: local worktree path captured as plan data.
- `branchName`: current branch captured as plan data.
- `specPath`: feature spec path captured as plan data.
- `implementerAgent`: provider-neutral implementer role label.
- `reviewerAgent`: provider-neutral reviewer role label.
- `validationCommands`: copied list of validation commands.
- `allowedMutationScope`: copied list of planned mutation boundaries.
- `createdAt`: command timestamp.
- `rulesVersion`: execution-plan rules version.
- `executionStarted`: fixed `false`.
- `runtimeStarted`: fixed `false`.
- `subprocessStarted`: fixed `false`.
- `repositoryMutationStarted`: fixed `false`.
- `githubMutationStarted`: fixed `false`.

### Validation

- Plan ID must equal `<projectId>:execution-plan:<activeSessionId>:plan-v1`.
- Required lineage identifiers must match current task, active session, confirmed assignment, and prepared session.
- Repository/worktree/branch/spec data must be present and locally available according to injected checks.
- Role labels must be non-empty.
- Arrays are defensively copied.

## ExecutionPlanResult

Immutable command result for plan creation.

### Statuses

- `Created`: a new plan was created.
- `AlreadyExists`: a compatible plan already exists after command-time validation.
- `Blocked`: current state is incomplete, stale, or unsafe.
- `Failed`: required local store/context is unavailable.

### Fields

- `id`: deterministic result identifier.
- `projectId`
- `activeSessionId`
- `projectTaskId`
- `planId` when available.
- `status`
- `reasonCodes`
- `createdPlan`: boolean.
- `duplicateExistingPlan`: boolean.
- `executionStarted`: fixed `false`.
- `runtimeStarted`: fixed `false`.
- `subprocessStarted`: fixed `false`.
- `repositoryMutationStarted`: fixed `false`.
- `githubMutationStarted`: fixed `false`.
- `resultAt`
- `rulesVersion`

## ExecutionPlanCollection

Project-scoped immutable collection of plans.

### Fields

- `projectId`
- `plans`
- `planCount`
- `generatedAt`
- `rulesVersion`

## ExecutionPlanResultCollection

Project-scoped immutable collection of command results.

### Fields

- `projectId`
- `results`
- `resultCount`
- `generatedAt`
- `rulesVersion`

## State Transitions

```text
No plan
  -> Created
  -> ExecutionPlan stored

Existing compatible plan
  -> AlreadyExists
  -> no duplicate plan

Invalid current state
  -> Blocked or Failed
  -> no plan created
```

No transition starts execution, readiness, subprocesses, repository mutation, or GitHub mutation.
