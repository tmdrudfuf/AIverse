# Implementation Plan: Runtime Preflight Foundation

## Architecture

Add a focused `runtime-preflight` domain under `src/features/city-view/scene/office/`.

Owned modules:

- `RuntimePreflightTypes.ts`: immutable domain types, deterministic IDs, collections, provider evidence contracts, defensive-copy helpers.
- `RuntimePreflightService.ts`: command-time preflight evaluation and result aggregation.
- `RuntimePreflightProvider.ts`: provider-neutral evidence interface plus default represented evidence provider.
- `RuntimePreflightView.ts`: bounded dashboard row formatter.

## Reuse

The implementation reuses existing Execution Plan, Execution Readiness, Human Execution Approval, ProjectTask, confirmed assignment, prepared session, active session, employee, repository metadata, controller, dashboard, and project-isolation conventions. It does not duplicate task, employee, session, repository, or agent architecture.

## Validation Order

Controller flow:

```text
Execution Plan command-time revalidation
-> Execution Readiness command-time re-evaluation
-> require Ready
-> Human Execution Approval revalidation inside RuntimePreflightService
-> provider evidence checks
```

Provider checks do not run when an earlier layer blocks.

## Runtime Boundary

The controller and domain services do not contain filesystem calls, Git commands, CLI process spawning, or path parsing against the developer machine. Runtime evidence enters through `RuntimeEnvironmentProvider`. The default provider normalizes existing approved context into bounded evidence; future OS-backed adapters can implement the same interface.

## Atomicity and Idempotency

`RuntimePreflightService` creates a complete immutable preflight and result together. Collections use deterministic latest-result replacement by preflight/result ID. Repeated evaluation rechecks current evidence and can move from Ready to Blocked.

## Dashboard Strategy

Add `[RUNTIME PREFLIGHT]` rows after human approval rows. Rows use bounded wording, show check counts and one primary reason, and preserve priority-aware overflow behavior from Specs 070-072.

## Validation Strategy

Run focused tests for the runtime-preflight module plus touched controller/view tests. Before review, run full validation: `npm test`, `npx tsc --noEmit`, `npm run build`, `git diff --check`, and `git diff --cached --check`.
