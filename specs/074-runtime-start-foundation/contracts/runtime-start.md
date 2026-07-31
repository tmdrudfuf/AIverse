# Runtime Start Contract

## Command

```text
RuntimeStartCommand
projectId
executionPlanId
runtimePreflightId
startedBy
requestedAt
```

The command is available only through an explicit human action. The actor must be a human label.

## Result Statuses

```text
Started
AlreadyStarted
Blocked
Failed
```

## Required Service Behavior

1. Revalidate the supplied execution plan and context.
2. Require a current Ready Runtime Preflight.
3. Reject stale, mismatched, or unsafe current state.
4. Create RuntimeStart and RuntimeStartResult atomically.
5. Preserve upstream records.
6. Never invoke agents, spawn subprocesses, run validation commands, or mutate repositories/GitHub.

## Dashboard Contract

Rows must be equivalent to:

```text
[RUNTIME START] Runtime Start Available; Explicit Human Start Required; Execution Not Started; Agents Not Started
[RUNTIME START] Runtime Start Recorded; Execution Started; Agents Not Started; Awaiting Implementer Start
[RUNTIME START] Runtime Start Blocked; Resolve Runtime Preflight; Execution Not Started; Agents Not Started; <reason>
```
