# Quickstart: GitHub Issue Candidate Task Mapping Foundation

## Scenario 1: Domain mapping

Run:

```powershell
npx vitest run src/features/city-view/scene/office/candidate-tasks/*.test.ts
```

Expected:

- Succeeded issue collections map one unique candidate task per issue.
- Priority and type inference match the contract.
- Empty and unavailable issue collections are handled honestly.
- Caller mutation cannot affect later mapping results.

## Scenario 2: Controller and dashboard integration

Run:

```powershell
npx vitest run `
  src/features/city-view/scene/office/OfficeProjectPortalController.issue-sync.test.ts `
  src/features/city-view/scene/office/OfficeProjectPortalView.test.ts
```

Expected:

- Candidate tasks are derived from existing issue sync results.
- No additional GitHub issue request is made by candidate mapping.
- The project dashboard labels raw issue rows separately from AIverse Candidate Task rows.
- Candidate rows show count, top task priority/type, linked issue number, title, and state when row budget allows.

## Full validation

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```
