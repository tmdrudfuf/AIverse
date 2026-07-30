# Contract: Human Execution Approval Command

## Command

```text
ApproveExecution(projectId, executionPlanId, readinessId, approvedBy, requestedAt)
```

## Preconditions

1. Execution Plan revalidation succeeds.
2. Readiness is re-evaluated at command time.
3. Current readiness status is Ready.
4. The approver is a human actor.
5. No execution, agent, repository mutation, or GitHub mutation flag is true.
6. The existing approval, when present, exactly matches the current context.

## Outcomes

- `Approved`: creates one immutable approval and one result.
- `AlreadyApproved`: existing approval exactly matches the current revalidated context.
- `Blocked`: business state or evidence is stale, unsafe, mismatched, or not Ready.
- `Failed`: malformed command or unavailable approval store.

## Non-Effects

The command does not start execution, invoke agents, spawn subprocesses, run validation commands, inspect real paths, mutate repositories, mutate GitHub, create commits, push, or create pull requests.
