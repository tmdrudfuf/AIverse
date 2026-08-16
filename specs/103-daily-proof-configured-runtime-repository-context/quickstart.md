# Quickstart: Daily Proof Configured Runtime Repository Context

## Focused Validation

ADOS validation is intentionally run outside this runtime. The focused command for the reviewer/operator is:

```powershell
npx vitest run src/features/city-view/scene/office/OfficeProjectPortalRegistry.test.ts src/features/city-view/scene/office/OfficeProjectPortalController.issue-sync.test.ts src/features/city-view/scene/office/execution-plans/ExecutionPlanService.test.ts
```

Expected outcomes:

- `createProjectPortalState()` exposes Daily Proof with a configured local binding for feature 103.
- Driving Daily Proof to execution-plan creation records distinct `repositoryPath` and `worktreePath`.
- Execution-plan creation accepts configured branch context when repository sync evidence omits a local branch.
- Execution-plan creation still blocks when explicit branch evidence differs from the configured branch.

## Full ADOS Validation

Run outside this runtime:

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```
