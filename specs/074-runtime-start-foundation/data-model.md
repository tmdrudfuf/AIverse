# Data Model: Runtime Start Foundation

## RuntimeStart

- `runtimeStartId`: deterministic ID, `<projectId>:runtime-start:<executionPlanId>:start-v1`
- `projectId`
- `executionPlanId`
- `executionReadinessResultId`
- `humanExecutionApprovalId`
- `runtimePreflightId`
- `taskId`
- `confirmedAssignmentId`
- `preparedSessionId`
- `activeSessionId`
- `employeeId`
- `repositoryId`
- `repositoryRoot`
- `worktreePath`
- `branch`
- `specificationPath`
- `implementer`
- `reviewer`
- `validationCommands`
- `mutationScope`
- `startedBy`
- `startedAt`
- `executionApproved: true`
- `runtimePreflightPassed: true`
- `executionStarted: true`
- `agentStarted: false`
- `implementerStarted: false`
- `reviewerStarted: false`
- `validationStarted: false`
- `repositoryMutationStarted: false`
- `githubMutationStarted: false`
- `rulesVersion`

## RuntimeStartResult

- `id`
- `projectId`
- `executionPlanId`
- `runtimeStartId`
- `runtimePreflightId`
- `approvalId`
- `status`: Started, AlreadyStarted, Blocked, Failed
- `reasonCodes`
- `started`
- `duplicateExistingStart`
- safety flags
- `resultAt`
- `rulesVersion`

## Validation Rules

- Plan, readiness, approval, and preflight must match the same project and context.
- Preflight must be current Ready and must indicate execution and agent state have not started.
- Actor must be a human label and must not be Codex, Claude, agent, bot, or automation.
- Existing start can return AlreadyStarted only after exact current-context comparison.
- Blocked and failed results do not create Runtime Start records.
