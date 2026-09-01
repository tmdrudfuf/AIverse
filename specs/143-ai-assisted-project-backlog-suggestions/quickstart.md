# Quickstart: AI-Assisted Project Backlog Suggestions

## Targeted Validation

Run targeted checks during this implementation:

```powershell
npm test -- ProjectBacklogSuggestionService
npm test -- OfficeProjectPortalController.project-backlog-suggestions
npm test -- BrowserOfficeSessionService
npm test -- PortfolioOperationsService
git diff --check
git diff --cached --check
```

ADOS will run the authoritative full configured validation pipeline after implementation.

## Runtime Evidence Scenario

1. Open the office project portal with at least two registered projects.
2. Select Project A and confirm an existing backlog item is visible.
3. Click the explicit suggestion generation control.
4. Confirm proposed Project A candidates appear and no backlog task is created yet.
5. Accept one suggestion after editing title/details/priority.
6. Confirm the accepted task appears only in Project A backlog and is not Ready.
7. Switch to Project B and confirm Project A suggestions/tasks are absent.
8. Generate Project B suggestions and reject one.
9. Reload or re-enter the portal.
10. Confirm Project A accepted/proposed state and Project B rejected/proposed state remain scoped and persisted.
