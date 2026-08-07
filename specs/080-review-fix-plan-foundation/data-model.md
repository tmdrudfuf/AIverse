# Data Model: Review Fix Plan Foundation

## ReviewFixPlanCommand

Explicit user command.

| Field | Type | Notes |
| --- | --- | --- |
| projectId | string | Selected project. |
| reviewFixRequestId | string | Exact current Review Fix Request being planned. |
| actor | string | Must be a human label such as `Local Human`. |
| plannedAt | string | Audit timestamp, never part of identity. |

## ReviewFixPlan

Immutable plan snapshot.

| Field | Type | Notes |
| --- | --- | --- |
| reviewFixPlanId | string | `<projectId>:review-fix-plan:<reviewFixRequestId>:review-fix-plan-v1`. |
| projectId | string | Project scope. |
| reviewFixRequestId | string | Current request ID. |
| planId | string | Execution Plan ID. |
| readinessId | string | Execution Readiness ID. |
| approvalId | string | Human Execution Approval ID. |
| preflightId | string | Runtime Preflight ID. |
| runtimeStartId | string | Runtime Start ID. |
| implementerRuntimeId | string | Implementer Runtime ID. |
| reviewerRuntimeId | string | Reviewer Runtime ID. |
| reviewerRuntimeResultId | string | Reviewer Runtime Result ID. |
| reviewTargetId | string | Review Target ID. |
| projectTaskId | string | Existing ProjectTask ID. |
| employeeId | string | Existing employee ID. |
| repositoryId | string | Repository metadata from plan/request. |
| worktreePath | string | Snapshot from request. |
| branch | string | Snapshot from request. |
| implementer | string | Plan implementer label. |
| reviewer | string | Plan reviewer label. |
| validationCommands | string[] | Defensive copy from request. |
| mutationScope | string[] | Defensive copy from request. |
| decision | `ChangesRequested` | Only concrete plannable decision. |
| plannedBy | string | Human actor label. |
| plannedAt | string | Audit timestamp. |
| fixExecutionStarted | false | Fixed safety flag. |
| validationRuntimeStarted | false | Fixed safety flag. |
| codexStarted | false | Fixed safety flag. |
| claudeStarted | false | Fixed safety flag. |
| subprocessStarted | false | Fixed safety flag. |
| validationStarted | false | Fixed safety flag. |
| repositoryMutationStarted | false | Fixed safety flag. |
| githubMutationStarted | false | Fixed safety flag. |
| rulesVersion | string | `review-fix-plan-v1`. |

## ReviewFixPlanResult

Immutable command result.

| Field | Type | Notes |
| --- | --- | --- |
| id | string | Deterministic result ID for project/request/rules. |
| projectId | string | Project scope. |
| reviewFixRequestId | string | Requested plan target. |
| reviewerRuntimeId | string? | Reviewer Runtime ID when available. |
| reviewFixPlanId | string? | Present for `Planned` and `AlreadyPlanned`. |
| status | Planned / AlreadyPlanned / Blocked / Failed | Safe command outcome. |
| planned | boolean | True only when a plan exists. |
| alreadyPlanned | boolean | True only for idempotent repeat. |
| reasonCodes | string[] | Deterministic safe reasons. |
| safety flags | false | Same fixed flags as plan. |
| resultAt | string | Audit timestamp. |
| rulesVersion | string | `review-fix-plan-v1`. |

## Exact-Context Equality

An existing plan is current only when every stored field above matches the current request snapshot, including role labels, validation commands, mutation scope, repository/worktree/branch, runtime chain IDs, project task ID, employee ID, and reviewer decision.

## Immutability

Creation helpers copy every record and array. Callers cannot mutate returned plans, results, collections, validation commands, or mutation scope arrays to affect later reads.
