# Runtime Verification: Operator Task Planning Project Backlog Foundation

## Browser Runtime Evidence

Playwright coverage in `e2e/project-backlog-office.spec.ts` demonstrates the runtime scenario in Chromium with safe deterministic state:

- Project A creates two backlog tasks: `Add customer search` and `Fix invoice export`.
- Project B creates a separate backlog task: `Add photo tagging`.
- The browser enters Project A's real office scene and opens the project backlog from the operator portal.
- The runtime form creates a third Project A task: `Improve onboarding checklist`.
- The runtime form updates that Project A task to `ready` and `urgent`.
- Switching Project A -> Project B verifies Project A tasks are absent from Project B.
- Returning Project B -> Project A verifies Project A's two tasks are still present.
- Browser reload verifies Project A's created task, Ready status, and Urgent priority persist with canonical project ids.
- Updating Project A to Ready verifies no development request draft, ADOS run status, execution id, or development request id is created.
- Missing and unavailable project contexts reject task creation and leave backlog collections empty.

Captured runtime screenshot: `runtime-project-backlog-office.png`

## Commands Run In This Runtime

```bash
npx vitest run src/features/city-view/scene/office/project-backlog/ProjectBacklogService.test.ts src/features/city-view/scene/office/browser-session/BrowserOfficeSessionService.test.ts src/features/city-view/scene/office/OfficeProjectPortalController.project-backlog.test.ts src/features/city-view/scene/office/OfficeProjectPortalView.test.ts src/features/city-view/scene/PortfolioOperationsService.test.ts
npx tsc --noEmit
npx playwright test e2e/project-backlog-office.spec.ts --project=chromium
git diff --check
```

ADOS will run the authoritative full validation pipeline after implementation.
