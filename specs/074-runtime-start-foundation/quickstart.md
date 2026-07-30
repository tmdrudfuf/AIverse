# Quickstart: Runtime Start Foundation

## Focused Tests

Run Runtime Start focused coverage:

```powershell
npx vitest run src/features/city-view/scene/office/runtime-start/RuntimeStartService.test.ts src/features/city-view/scene/office/runtime-start/RuntimeStartView.test.ts src/features/city-view/scene/office/OfficeProjectPortalController.issue-sync.test.ts src/features/city-view/scene/office/OfficeProjectPortalView.test.ts
```

## Full Validation

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```

## Manual Flow

1. Open the Project Dashboard.
2. Advance the existing chain one explicit input at a time:

```text
approve -> promote -> confirm assignment -> prepare session -> start active session -> create plan -> validate readiness -> approve execution -> run runtime preflight -> start approved runtime
```

3. Verify Runtime Start appears only after Ready preflight and a separate explicit start input.
4. Verify repeated start returns AlreadyStarted and creates no duplicate.
5. Verify changed branch, dirty worktree, missing approval, stale preflight, changed commands, or changed mutation scope blocks start.
6. Verify dashboard shows `Execution Started` only after Runtime Start and always pairs it with `Agents Not Started`.
7. Verify no Codex/Claude process starts, no validation command runs, no files are edited, no Git mutation occurs, no GitHub mutation occurs, no push occurs, and no PR is created.
