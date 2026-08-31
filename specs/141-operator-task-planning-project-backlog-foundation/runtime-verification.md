# Runtime Verification: Operator Task Planning Project Backlog Foundation

## Deterministic Evidence

Automated targeted coverage demonstrates the runtime scenario with safe deterministic state:

- Project A creates two backlog tasks: `Add customer search` and `Fix invoice export`.
- Project B creates a separate backlog task: `Add photo tagging`.
- Switching Project A -> Project B verifies Project A tasks are absent from Project B.
- Returning Project B -> Project A verifies Project A's two tasks are still present.
- Browser session restore verifies both Project A and Project B backlog collections persist with canonical project ids.
- Updating Project A to Ready verifies no development request draft, ADOS run status, execution id, or development request id is created.
- Missing and unavailable project contexts reject task creation and leave backlog collections empty.

## Commands Run In This Runtime

```bash
npx vitest run src/features/city-view/scene/office/project-backlog/ProjectBacklogService.test.ts src/features/city-view/scene/office/browser-session/BrowserOfficeSessionService.test.ts src/features/city-view/scene/office/OfficeProjectPortalController.project-backlog.test.ts src/features/city-view/scene/office/OfficeProjectPortalView.test.ts src/features/city-view/scene/PortfolioOperationsService.test.ts
npx tsc --noEmit
git diff --check
```

ADOS will run the authoritative full validation pipeline after implementation.
