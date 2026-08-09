# Data Model: Review Fix Runtime Foundation

## ReviewFixRuntimeCommand

- `projectId`
- `reviewFixPlanId`
- `actor`
- `startedAt`

Represents the explicit human start request. Actor validation occurs before idempotent replay checks.

## ReviewFixRuntime

- `reviewFixRuntimeId`
- `projectId`
- `projectTaskId`
- `executionPlanId`
- `implementerRuntimeId`
- `reviewTargetId`
- `reviewerRuntimeId`
- `reviewerRuntimeResultId`
- `reviewDecisionId`
- `reviewFixRequestId`
- `reviewFixPlanId`
- `repositoryPath`
- `worktreePath`
- `featureBranch`
- `targetSha`
- `expectedHeadSha`
- `implementerAgentId`
- `reviewerAgentId`
- `mutationScope`
- `validationCommandSnapshot`
- `runtimeRulesVersion`
- `requestRulesVersion`
- `planRulesVersion`
- `promptId`
- `startedBy`
- `startedAt`
- `completedAt`
- `status`
- `statusReason`
- `evidence`
- safety flags proving no automatic validation, review, GitHub, push, PR, Ready, merge, deploy, or deletion was started

Immutable record for one provider attempt.

## ReviewFixRuntimeEvidence

- `reviewFixRuntimeId`
- `providerId`
- `command`
- `workingDirectory`
- `exitCode`
- `timedOut`
- `startedAt`
- `completedAt`
- `stdout`
- `stderr`
- `output`

Evidence belongs to exactly one runtime attempt.

## ReviewFixRuntimeResult

- `reviewFixRuntimeResultId`
- `reviewFixRuntimeId`
- `projectId`
- `reviewFixPlanId`
- `status`
- `statusReason`
- `message`
- `attemptedProviderInvocation`
- `alreadyCompleted`
- `duplicateActiveAttempt`
- `createdAt`
- optional `runtime`
- optional `evidence`

Blocked and failed pre-spawn results can exist without a runtime record.

## Collections

`ReviewFixRuntimeCollection` and `ReviewFixRuntimeResultCollection` are immutable append/upsert containers. Upsert returns a new collection and preserves previous records.

## Deterministic Identity

Runtime ID:

```text
<projectId>:review-fix-runtime:<reviewFixPlanId>:review-fix-runtime-v1
```

Result ID:

```text
<projectId>:review-fix-runtime-result:<reviewFixRuntimeId>:review-fix-runtime-v1
```

Prompt ID:

```text
<projectId>:review-fix-runtime-prompt:<reviewFixPlanId>:review-fix-runtime-v1
```

The formula binds project and exact current plan context and cannot collide across projects.
