# Runtime Verification: Controlled Backlog Readiness Promotion Policy

The deterministic evidence payload is recorded in `runtime-evidence.json`.

Runtime verification demonstrates two canonical registered projects using the existing Spec 141 project backlog flow:

- Project A has Auto Ready explicitly enabled with allowed priority `high` and max promotions `1`.
- Project A receives one `high` backlog task and one `low` backlog task.
- Project A promotes the `high` backlog task to Ready exactly once through the existing backlog update transition.
- Project A leaves the `low` task in backlog with a priority-policy skip reason.
- Re-evaluation does not create a duplicate Ready representation.
- Project B has Auto Ready off and receives an `urgent` backlog task that remains backlog.
- Reload restores Project A policy/evaluation state and Project B disabled state without granting new consent.
- Manual Spec 141 backlog to Ready promotion continues to work.
- Active execution safety prevents automatic promotion while active project execution exists.

No Spec 142 bridge, Spec 144 autonomous coordinator, ADOS execution, Codex invocation, Claude invocation, Git mutation, GitHub mutation, review, publish, merge, or deploy is part of readiness promotion.

## Evidence Captured In This Runtime

- `OfficeProjectPortalController.project-backlog.test.ts` proves the full two-project runtime scenario: Project A policy enablement, priority filtering, Ready-only promotion, idempotent re-evaluation, Project B isolation, no ADOS start, active execution blocking, and manual Ready continuity.
- `ProjectBacklogReadinessPromotionPolicyService.test.ts` proves disabled defaults, malformed/cross-project/disconnected fail-closed behavior, origin filtering, deterministic ordering, bounded promotion, duplicate protection, active execution safety, and preservation of manual transition semantics.
- `OfficeProjectPortalController.browser-session.test.ts` proves project-scoped persistence for Auto Ready policies and fail-closed restore of malformed consent state.
- `PortfolioOperationsService.test.ts` proves the portfolio Auto Ready summary is project-scoped and read-only.
