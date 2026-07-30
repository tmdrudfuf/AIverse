# Spec 073: Runtime Preflight Foundation

## Summary

Runtime Preflight adds an explicit local safety-check layer after Human Execution Approval. It validates that the approved execution context is currently safe to proceed toward a later Runtime Start decision. It does not start execution, invoke agents, run validation commands, edit files, create branches, commit, push, or mutate GitHub.

## Product Flow

```text
GitHub Issue
-> Candidate Task
-> Assignment Recommendation
-> Human Promotion
-> ProjectTask
-> Confirmed Assignment
-> Prepared Work Session
-> Active Work Session
-> Execution Plan
-> Execution Readiness
-> Human Execution Approval
-> Runtime Preflight
```

## Boundary

Runtime Preflight remains separate from Runtime Start, agent process launch, validation execution, and repository mutation. A Ready preflight means only that the current approved context passed represented domain checks and bounded runtime evidence checks.

## Functional Requirements

- Runtime Preflight must require an explicit `Run Runtime Preflight` action.
- Human Execution Approval alone must not run preflight automatically.
- The validation order is Execution Plan revalidation, Execution Readiness re-evaluation, Human Execution Approval revalidation, then runtime provider checks.
- The approval must match the exact current plan, readiness, task/session chain, employee, repository, role context, validation commands, and mutation scope.
- Preflight records and results must be immutable snapshots with deterministic IDs.
- Provider evidence must be structured, bounded, defensive-copied, and display-safe.
- Provider failure must produce a Failed preflight result rather than an unhandled exception.
- Repeated preflight must revalidate current evidence and may replace the latest deterministic snapshot without creating duplicate active preflight state.
- Runtime Preflight must not start execution, agents, subprocesses, validation commands, repository mutation, or GitHub mutation.

## Validation Coverage

Focused tests cover identity, immutability, explicit action, validation order, approval revalidation, repository/worktree/branch/working-tree/spec checks, agent availability and command safety, validation-command safety, mutation-scope safety, provider failure, idempotency, project isolation, controller integration, dashboard wording/layout, and no-execution safety.
