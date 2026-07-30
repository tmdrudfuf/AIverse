# Data Model: Runtime Preflight

## RuntimePreflight

- `preflightId`
- `projectId`
- `executionPlanId`
- `readinessId`
- `approvalId`
- `activeSessionId`
- `projectTaskId`
- `confirmedAssignmentId`
- `preparedSessionId`
- `employeeId`
- `repositoryId`
- `status`: `Ready | Blocked | Failed`
- `checks`
- `evaluatedAt`
- `rulesVersion`
- `executionApproved`
- `runtimePreflightPassed`
- fixed false flags: `executionStarted`, `agentStarted`, `repositoryMutationStarted`, `githubMutationStarted`

## RuntimePreflightResult

Contains deterministic result ID, status, reason codes, primary reason, passed/blocked/failed counts, safe flags, and timestamp.

## RuntimePreflightCheck

- `checkId`
- `category`
- `status`: `Passed | Blocked | Failed`
- `reason`
- `message`
- optional display-safe `expected` and `actual`

## RuntimePreflightEvidence

Structured provider evidence for repository, worktree, branch, working tree, specification, implementer, reviewer, validation commands, mutation scope, and runtime environment.
