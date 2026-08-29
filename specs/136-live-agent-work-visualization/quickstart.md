# Quickstart: Live Agent Work Visualization

## Focused Tests

```powershell
npx vitest run src/features/city-view/scene/office/LiveAgentWorkVisualization.test.ts src/features/city-view/scene/office/OfficeProjectPortalController.live-agent-work-visualization.test.ts src/features/city-view/scene/office/OfficeVisualLayer.test.ts src/features/city-view/scene/office/RenderedOfficeComposition.test.ts src/features/city-view/scene/office/npc/OfficeEmployeeNpcRenderer.test.ts src/features/city-view/scene/office/npc/EmployeeNpcMovementService.test.ts src/features/city-view/scene/office/OfficeInteractionController.test.ts
git diff --check
```

## Runtime Office Verification

1. Start the application when browser tooling is available.
2. Load the city and enter a selected project-company office.
3. Seed or use representative persisted run states for implementation, validation, review, publication, blocked, complete, and no-active-run.
4. Confirm employees associate with Engineering, Validation / QA, Review, Project Status / Operations, or idle/shared areas according to real state.
5. Confirm employee labels are readable and lower-right legacy status clutter is reduced.
6. Confirm Project Status shows selected-project truthful run information and no fabricated percentages.
7. Confirm COMPLETE clears stale active work labels.
8. Confirm switching projects does not leak previous project state.
9. Confirm the Spec 135 office composition remains intact.

## Runtime Evidence Captured

- `test-results/spec136-runtime/validation-active-office.png`: seeded selected-project persisted ADOS status `Started validation`; verified the actual office renders Validation / QA with the QA employee labeled `Validating` and Project Status showing `Validating - Started validation`.
- `test-results/spec136-runtime/complete-clears-active-office.png`: seeded selected-project persisted ADOS status `Completed implementer`; verified Project Status shows `Complete - Completed Completed implementer` and active `Working`, `Reviewing`, and `Validating` labels are not stale.
- Browser signals were clean after filtering the existing Chromium WebGL readback warning observed during screenshot capture.

## Deferred to ADOS

ADOS will run the full configured validation pipeline and independent Claude review:

```powershell
npm test
npx tsc --noEmit
npm run build
npm run test:e2e:home-canvas
git diff --check
git diff --cached --check
```
