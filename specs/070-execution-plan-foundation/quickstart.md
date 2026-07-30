# Quickstart: Execution Plan Foundation

## Focused Validation

Run the execution-plan focused tests:

```powershell
npx vitest run `
  src/features/city-view/scene/office/execution-plans/ExecutionPlanTypes.test.ts `
  src/features/city-view/scene/office/execution-plans/ExecutionPlanService.test.ts `
  src/features/city-view/scene/office/execution-plans/ExecutionPlanView.test.ts `
  src/features/city-view/scene/office/OfficeProjectPortalController.issue-sync.test.ts `
  src/features/city-view/scene/office/OfficeProjectPortalView.test.ts
```

Expected outcome:

- deterministic IDs are stable;
- valid active sessions create exactly one execution plan;
- repeated creation returns `AlreadyExists` only after revalidation;
- stale or missing repository/worktree/spec/role state is blocked;
- dashboard rows show execution is not started.

## Full Validation

Run:

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```

## Dashboard Verification

In the Project Dashboard, after the controlled sequence:

```text
approve -> promote -> confirm assignment -> prepare session -> start session -> create execution plan
```

the dashboard should show an `Execution Plan` row with:

- `Execution Plan Ready`
- Implementer and Reviewer labels
- branch and worktree reference
- spec path reference
- validation command summary
- mutation scope summary
- `Execution Not Started`
- `Awaiting Readiness Validation`

The dashboard must not show `Running`, `Executing`, `Coding`, or `Reviewing` for execution-plan rows.

## Safety Verification

Creating an execution plan must not:

- change task status;
- change employee status;
- change assignment, prepared-session, or active-session records;
- invoke Codex or Claude;
- spawn subprocesses;
- mutate repository files;
- mutate GitHub.

Durable persistence, readiness validation, runtime execution, scheduling, and remote mutation remain deferred.
