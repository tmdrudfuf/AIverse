# Quickstart: Ready Task to Development Request Execution Bridge

## Focused Tests

Run focused deterministic coverage for the bridge:

```bash
npx vitest run src/features/city-view/scene/office/project-backlog/ProjectBacklogDevelopmentBridgeService.test.ts src/features/city-view/scene/office/OfficeProjectPortalController.project-backlog-development.test.ts src/features/city-view/scene/office/external-ados-execution/ExternalProjectAdosExecutionService.test.ts src/features/city-view/scene/office/browser-session/BrowserOfficeSessionService.test.ts src/features/city-view/scene/PortfolioOperationsService.test.ts
```

ADOS will run the full configured validation pipeline after this implementation runtime:

```bash
npm test
npx tsc --noEmit
npm run build
npm run test:e2e:home-canvas
git diff --check
git diff --cached --check
```

## Runtime Bridge Evidence

Use a safe disposable/test project, not AIverse itself:

1. Register and bind a disposable local project with a trusted worktree path.
2. Create a Ready backlog task with multiline text and shell-like characters.
3. Select the task in the office backlog and verify preview-only state.
4. Choose Start Development.
5. Verify a real development request is created for the same canonical project.
6. Verify durable requirements content includes the full task content and source backlog task id.
7. Verify trusted ADOS execution launches through the existing execution service.
8. Verify task association includes request, preparation, and run id when known.
9. Reload/re-enter and verify Project Status/live visualization reads the associated run without relaunching.
