# Quickstart: Execution Readiness Validation Foundation

## Focused Tests

```powershell
npx vitest run src/features/city-view/scene/office/execution-readiness/ExecutionReadinessTypes.test.ts src/features/city-view/scene/office/execution-readiness/ExecutionReadinessService.test.ts src/features/city-view/scene/office/execution-readiness/ExecutionReadinessView.test.ts src/features/city-view/scene/office/OfficeProjectPortalController.issue-sync.test.ts src/features/city-view/scene/office/OfficeProjectPortalView.test.ts
```

Expected:

- valid current state returns `Ready`
- stale current state returns `Blocked`
- malformed internally inconsistent input returns `Failed`
- dashboard shows `Human Approval Not Granted` and `Execution Not Started`
- no readiness code imports or invokes filesystem/process/runtime APIs

## Full Validation

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```

## Manual Product Check

1. Progress a candidate through the local dashboard flow until an Execution Plan exists.
2. Use the explicit readiness action on the selected project.
3. Confirm `[EXECUTION READINESS]` appears with:
   - `Readiness Checks Passed` or blocked/failed wording
   - check counts
   - primary reason
   - `Human Approval Not Granted`
   - `Execution Not Started`
4. Confirm the task, employee, assignment, prepared session, active session, and Execution Plan are unchanged.

## Boundary Verification

Readiness validation must not:

- run validation commands
- inspect real local paths
- spawn subprocesses
- invoke Codex or Claude
- mutate repository files
- mutate GitHub
- grant human execution approval
- start runtime execution
