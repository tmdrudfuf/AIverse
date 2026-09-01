# Runtime Verification: AI-Assisted Project Backlog Suggestions

The deterministic evidence payload is recorded in `runtime-evidence.json`.

Runtime verification should demonstrate two registered projects with deterministic provider fixtures:

- Project A has existing context and backlog item.
- Project A receives generated suggestions only after explicit request.
- One Project A suggestion is accepted into Project A backlog only.
- Project B shows distinct context and no Project A suggestion or accepted task.
- Project B receives different generated suggestions after explicit request.
- One Project B suggestion is rejected without backlog mutation.
- Reload restores Project A and Project B suggestion histories without regeneration.

No shell, Git, ADOS, validation, review, publish, merge, or deploy mutation is part of suggestion generation.

## Evidence Captured In This Runtime

- `ProjectBacklogSuggestionService.test.ts` proves explicit provider invocation, same-project prompt isolation, malformed output handling, duplicate filtering, accept/reject semantics, edited acceptance, duplicate acceptance prevention, and fail-closed project identity checks.
- `OfficeProjectPortalController.project-backlog-suggestions.test.ts` proves Project A and Project B generation, Project A edited acceptance into backlog only, Project B rejection without backlog mutation, no generation on open/reload, persisted accepted/rejected state, and unchanged ADOS run status during suggestion operations.
- `BrowserOfficeSessionService.test.ts` proves proposed/accepted/rejected suggestion state persists through the existing browser office session snapshot and drops cross-project contamination.
- `PortfolioOperationsService.test.ts` proves subtle project-scoped suggestion counts include proposed candidates only.
