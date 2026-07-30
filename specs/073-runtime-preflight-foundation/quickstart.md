# Quickstart: Runtime Preflight Foundation

## Focused Tests

```powershell
npm test -- src/features/city-view/scene/office/runtime-preflight src/features/city-view/scene/office/OfficeProjectPortalController.issue-sync.test.ts src/features/city-view/scene/office/OfficeProjectPortalView.test.ts
```

## Full Validation

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```

## UI Flow

Open the Project Dashboard and proceed through the existing explicit sequence:

```text
approve promotion
-> promote Candidate Task
-> confirm assignment
-> prepare work session
-> start work session
-> create Execution Plan
-> evaluate readiness
-> approve execution
-> run Runtime Preflight
```

Runtime Preflight appears as `[RUNTIME PREFLIGHT]`.

## Expected States

- Before human approval: preflight is unavailable.
- After approval: preflight is required and must be explicitly run.
- Ready: dashboard shows `Runtime Preflight Passed`, `Ready for Runtime Start Decision`, `Execution Not Started`, and `Agents Not Started`.
- Blocked/Failed: dashboard shows safe blocked or failed wording with one primary reason.

## Safety Checks

Verify that Runtime Preflight does not run validation commands, start Codex, start Claude, spawn subprocesses, edit files, create branches, commit, push, create PRs, or mutate GitHub.
