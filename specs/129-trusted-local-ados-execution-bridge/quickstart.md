# Quickstart: Trusted Local ADOS Execution Bridge

## Focused Verification

1. Configure the external project draft with the local AIverse worktree identity.
2. Open the external Project Dashboard.
3. Activate the dashboard action once to create the development request draft.
4. Activate the dashboard action again to create the ADOS preparation.
5. Activate the dashboard action a third time to start or block the trusted local ADOS execution bridge.
6. Confirm the dashboard shows both `[ADOS PREP]` and `[ADOS EXEC]` rows.
7. Confirm the execution result records false validation, review, repository mutation, GitHub mutation, publish, merge, and deploy indicators.

## Focused Tests

```powershell
npx vitest run src/features/city-view/scene/office/external-ados-execution/ExternalProjectAdosExecutionService.test.ts src/features/city-view/scene/office/external-ados-execution/ExternalProjectAdosExecutionView.test.ts src/features/city-view/scene/office/OfficeProjectPortalController.project-dashboard.test.ts src/features/city-view/scene/office/OfficeProjectPortalView.test.ts src/features/city-view/scene/office/browser-session/BrowserOfficeSessionService.test.ts
```

## Full ADOS Validation

Run outside this handoff runtime:

```powershell
npm test
npx tsc --noEmit
npm run build
npm run test:e2e:home-canvas
git diff --check
git diff --cached --check
```
