# Data Model: Review Fix Request Foundation

## ReviewFixRequestCommand

Explicit user command.

| Field | Type | Notes |
| --- | --- | --- |
| projectId | string | Selected project. |
| reviewerRuntimeId | string | Exact Reviewer Runtime being requested for fixes. |
| actor | string | Must be a human label such as `Local Human`. |
| requestedAt | string | Audit timestamp, never part of identity. |

## ReviewFixRequest

Immutable request snapshot.

| Field | Type | Notes |
| --- | --- | --- |
| reviewFixRequestId | string | `<projectId>:review-fix-request:<reviewerRuntimeId>:review-fix-request-v1`. |
| projectId | string | Project scope. |
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
| repositoryId | string | Repository metadata from plan. |
| worktreePath | string | Snapshot from plan. |
| branch | string | Snapshot from plan. |
| implementer | string | Plan implementer label. |
| reviewer | string | Plan reviewer label. |
| validationCommands | string[] | Defensive copy from plan. |
| mutationScope | string[] | Defensive copy from plan. |
| decision | `ChangesRequested` | Only concrete requestable decision. |
| requestedBy | string | Human actor label. |
| requestedAt | string | Audit timestamp. |
| fixExecutionStarted | false | Fixed safety flag. |
| validationRuntimeStarted | false | Fixed safety flag. |
| codexStarted | false | Fixed safety flag. |
| claudeStarted | false | Fixed safety flag. |
| subprocessStarted | false | Fixed safety flag. |
| validationStarted | false | Fixed safety flag. |
| repositoryMutationStarted | false | Fixed safety flag. |
| githubMutationStarted | false | Fixed safety flag. |
| rulesVersion | string | `review-fix-request-v1`. |

## ReviewFixRequestResult

Immutable command result.

| Field | Type | Notes |
| --- | --- | --- |
| id | string | Deterministic result ID for project/runtime/rules. |
| projectId | string | Project scope. |
| reviewerRuntimeId | string | Requested runtime ID. |
| reviewFixRequestId | string? | Present for Requested/AlreadyRequested. |
| status | Requested / AlreadyRequested / Blocked / Failed | Safe command outcome. |
| requested | boolean | True only when a request exists. |
| alreadyRequested | boolean | True only for idempotent repeat. |
| reasonCodes | string[] | Deterministic safe reasons. |
| safety flags | false | Same fixed flags as request. |
| resultAt | string | Audit timestamp. |
| rulesVersion | string | `review-fix-request-v1`. |

## Exact-Context Equality

An existing request is current only when every stored field above matches the current chain snapshot, including role labels, validation commands, mutation scope, repository/worktree/branch, runtime chain IDs, project task ID, employee ID, and reviewer decision.

## Immutability

Creation helpers copy every record and array. Callers cannot mutate returned requests, results, collections, validation commands, or mutation scope arrays to affect later reads.
