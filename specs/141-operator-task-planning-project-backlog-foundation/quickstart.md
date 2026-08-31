# Quickstart: Operator Task Planning Project Backlog Foundation

## Targeted Validation

Run targeted tests for the new project backlog service, persistence, office portal behavior, and portfolio summary:

```bash
npx vitest run src/features/city-view/scene/office/project-backlog/ProjectBacklogService.test.ts src/features/city-view/scene/office/browser-session/BrowserOfficeSessionService.test.ts src/features/city-view/scene/office/OfficeProjectPortalController.project-backlog.test.ts src/features/city-view/scene/office/OfficeProjectPortalView.test.ts src/features/city-view/scene/PortfolioOperationsService.test.ts
git diff --check
```

ADOS will run the full configured validation pipeline after this implementation.

## Runtime Evidence Scenario

1. Enter/select Project A and open the office planning backlog.
2. Create at least two Project A backlog tasks.
3. Update one Project A task's priority or planning status.
4. Switch to Project B and open its backlog.
5. Verify Project A tasks are absent and Project B has different planned work.
6. Reload the browser session.
7. Return to Project A and verify Project A tasks, priority, and status persisted.
