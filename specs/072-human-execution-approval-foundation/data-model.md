# Data Model: Human Execution Approval Foundation

## HumanExecutionApproval

- `approvalId`: deterministic ID.
- `projectId`: owning project.
- `executionPlanId`: exact plan approved by the human.
- `readinessId`: current readiness evaluation used for approval.
- `activeSessionId`: active work-session context.
- `projectTaskId`: task context.
- `confirmedAssignmentId`: confirmed employee assignment.
- `preparedSessionId`: prepared-session context.
- `employeeId`: approved employee context.
- `repositoryId`: repository evidence identity.
- `implementerAgent`: implementer role context captured from the Execution Plan.
- `reviewerAgent`: reviewer role context captured from the Execution Plan.
- `validationCommands`: ordered validation-command context captured from the Execution Plan.
- `allowedMutationScope`: allowed mutation scope captured from the Execution Plan.
- `decision`: `Approved`.
- `executionApproved`: `true`.
- `approvedAt`: local command timestamp.
- `approvedBy`: provider-neutral human actor label.
- `rulesVersion`: `approval-v1`.
- `executionStarted`, `agentStarted`, `repositoryMutationStarted`, `githubMutationStarted`: fixed `false`.

## HumanExecutionApprovalResult

- `id`: deterministic result ID.
- `projectId`: owning project.
- `executionPlanId`: evaluated plan.
- `readinessId`: evaluated readiness when available.
- `approvalId`: approval identity when available.
- `status`: `Approved`, `AlreadyApproved`, `Blocked`, or `Failed`.
- `reasonCodes`: immutable machine-readable reasons.
- `approved`: true only when a new approval record was created.
- `duplicateExistingApproval`: true only for an exact current AlreadyApproved result.
- `executionApproved`: true for Approved or AlreadyApproved.
- Safety flags: execution, agent, repository mutation, and GitHub mutation remain false.
- `resultAt`: local command timestamp.
- `rulesVersion`: `approval-v1`.

## Identity

```text
<projectId>:human-execution-approval:<executionPlanId>:approval-v1
```

## Transitions

- No approval record -> Approved when current plan and readiness are valid.
- Approved -> AlreadyApproved on identical repeated current approval.
- Any stale or unsafe current context -> Blocked or Failed with no new approval.
