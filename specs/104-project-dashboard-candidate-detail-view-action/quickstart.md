# Quickstart: Project Dashboard Candidate Detail View Action

Validation is expected outside this ADOS runtime.

## Focused Scenario

1. Open the AIverse office portal.
2. Open the Daily Proof Project Dashboard.
3. Wait for candidate task rows and promotion review context to appear.
4. Press Space/action and confirm candidate detail opens for the selected candidate.
5. Confirm candidate detail shows issue, priority/type, source, summary, assignment, and promotion context.
6. Press Esc and confirm the Project Dashboard returns for Daily Proof.
7. Press Enter on the Project Dashboard and confirm the existing selected candidate progression behavior remains available.

## Focused Tests

```powershell
npx vitest run src/features/city-view/scene/office/OfficeProjectPortalController.project-dashboard.test.ts src/features/city-view/scene/office/OfficeProjectPortalView.test.ts
```

## Full ADOS Validation

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```
