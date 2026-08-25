# Quickstart: External Project ADOS Run Preparation

This ADOS implementation runtime must not run validation, review, publication, merge, deployment, GitHub mutation, primary repository mutation, or agent/runtime starts.

## Manual Scenario

1. Add the external project draft from the Company Dashboard.
2. Open the external project Project Dashboard.
3. Configure repository identity.
4. Activate the dashboard action once to create the development request draft.
5. Activate the dashboard action again to create the ADOS run preparation.
6. Confirm the dashboard shows both `DEV REQUEST` and `ADOS PREP` rows.
7. Reload or restore browser office session state.
8. Confirm the `ADOS PREP` row remains and no runtime, validation, review, repository, GitHub, publish, merge, or deploy state was created.

## Focused Validation For Allowed Validation Runtime

```powershell
npx vitest run src/features/city-view/scene/office/OfficeProjectPortalController.project-dashboard.test.ts src/features/city-view/scene/office/external-ados-run-preparation/ExternalProjectAdosRunPreparationService.test.ts src/features/city-view/scene/office/external-ados-run-preparation/ExternalProjectAdosRunPreparationView.test.ts src/features/city-view/scene/office/browser-session/BrowserOfficeSessionService.test.ts
```

## Full ADOS Validation For Allowed Validation Runtime

```powershell
npm test
npx tsc --noEmit
npm run build
npm run test:e2e:home-canvas
git diff --check
git diff --cached --check
```
