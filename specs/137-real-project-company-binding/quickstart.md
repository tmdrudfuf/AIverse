# Quickstart: Real Project Company Binding

## Automated Verification

Run focused tests for this feature:

```bash
npm test -- --run src/features/city-view/scene/office/project-company-binding/ProjectCompanyBindingService.test.ts src/features/city-view/scene/office/OfficeProjectPortalController.project-company-binding.test.ts src/features/city-view/scene/office/LiveAgentWorkVisualization.test.ts
```

ADOS will run the authoritative full validation pipeline after implementation:

```bash
npm test
npx tsc --noEmit
npm run build
npm run test:e2e:home-canvas
git diff --check
git diff --cached --check
```

## Runtime Verification

1. Start AIverse in the feature worktree.
2. Enter a registered project company from the city.
3. Verify office signage/title and Project Status identify that bound project.
4. Switch to a second registered project company or deterministic fixture state.
5. Verify status, run stage, employees, blocked/complete/no-run state, and portal context change with the selected company.
6. Confirm missing project/path scenarios show unavailable state rather than another project's data.
