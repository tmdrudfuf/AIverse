# Quickstart: External Project ADOS Run Status

## Focused Verification

Run outside this handoff runtime:

```powershell
npx vitest run src/features/city-view/scene/office/external-ados-run-status/ExternalProjectAdosRunStatusService.test.ts src/features/city-view/scene/office/external-ados-run-status/ExternalProjectAdosRunStatusView.test.ts src/features/city-view/scene/office/OfficeProjectPortalView.test.ts src/features/city-view/scene/office/browser-session/BrowserOfficeSessionService.test.ts
```

Expected result:

- Prepared-only state renders a prepared ADOS status.
- Execution result state renders the latest run status and reason.
- Browser session save/restore preserves status state.
- Rendering status does not imply validation, review, GitHub, publish, merge, deploy, or repository mutation side effects.

## Full Validation

Run outside this handoff runtime:

```powershell
npm test
npx tsc --noEmit
npm run build
npm run test:e2e:home-canvas
git diff --check
git diff --cached --check
```
