# Runtime Verification: Controlled AI Suggestion Acceptance Policy

The deterministic evidence payload is recorded in `runtime-evidence.json`.

Runtime verification demonstrates two canonical registered projects using the existing Spec 143 suggestion flow and Spec 141 backlog conversion:

- Project A has auto-accept explicitly enabled with allowed priority `high`.
- Project A receives one `high` suggestion and one `low` suggestion.
- Project A auto-accepts the `high` suggestion into exactly one backlog task.
- Project A leaves the `low` suggestion proposed with a priority-policy skip reason.
- Project A re-evaluation does not create a duplicate task.
- Project B has auto-accept off and receives an `urgent` suggestion that remains proposed.
- Reload restores Project A policy/provenance and Project B manual state without granting new consent.
- Manual Spec 143 accept and reject actions continue to work.

No Spec 142 bridge, Spec 144 autonomous coordinator, ADOS execution, Git mutation, GitHub mutation, review, publish, merge, or deploy is part of suggestion acceptance.

## Evidence Captured In This Runtime

- `OfficeProjectPortalController.project-backlog-suggestions.test.ts` proves the full two-project runtime scenario: Project A policy enablement, priority filtering, backlog-only creation with automatic provenance, no Ready transition, no execution mutation, idempotent re-evaluation, Project B policy remaining off, Project B suggestion remaining proposed, reload persistence, and manual accept/reject continuity.
- `ProjectBacklogSuggestionAcceptancePolicyService.test.ts` proves fail-closed policy defaults, malformed/cross-project/disconnected rejection, duplicate protection, deterministic ordering, bounded acceptance, accepted/rejected suggestion exclusion, and backlog-only task state.
- `BrowserOfficeSessionService.test.ts` proves project-scoped persistence for acceptance policies and suggestion/task provenance.
- `PortfolioOperationsService.test.ts` proves the portfolio summary is read-only and project-scoped.
