# Quickstart: In-Office Development Request

## Automated Verification

Run targeted tests for request targeting, preparation, execution safety, persistence, status, live visualization, and employee scoping:

```bash
npm test -- --run src/features/city-view/scene/office/external-development-requests src/features/city-view/scene/office/external-ados-run-preparation src/features/city-view/scene/office/external-ados-execution src/features/city-view/scene/office/LiveAgentWorkVisualization.test.ts src/features/city-view/scene/office/OfficeProjectPortalController.project-company-binding.test.ts
```

ADOS will run the configured full validation pipeline after implementation:

```bash
npm test
npx tsc --noEmit
npm run build
npm run test:e2e:home-canvas
git diff --check
git diff --cached --check
```

## Runtime Verification

Where safe, register a disposable project, enter its bound company office, create a harmless doc-only request, confirm the target identity, submit, and verify a real ADOS run is accepted for that disposable repository only. Do not use AIverse itself as a recursive target while this feature worktree is active.
