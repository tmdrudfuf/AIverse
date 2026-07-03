# Tasks: Company Influence Planning System

**Input**: Design documents from specs/029-company-influence-planning-system/
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

## Phase 1: Setup and Existing System Review

**Purpose**: Confirm current dashboard and portal architecture before any implementation changes.

- [x] T001 Inspect `src/features/city-view/scene/office/dashboard/CompanyDashboardTypes.ts`, `src/features/city-view/scene/office/dashboard/CompanyDashboardView.ts`, `src/features/city-view/scene/office/dashboard/InternalSimulationDashboardProvider.ts`, `src/features/city-view/scene/office/OfficeProjectPortalController.ts`, `src/features/city-view/scene/office/OfficeProjectPortalTypes.ts`, and `src/features/city-view/scene/office/OfficeProjectPortalView.ts`.
- [x] T002 Inspect relevant tests under `src/features/city-view/scene/office/dashboard/` and `src/features/city-view/scene/office/OfficeProjectPortalController.*.test.ts` to confirm current test approach.
- [x] T003 Update `specs/029-company-influence-planning-system/plan.md` if inspection shows the source touchpoints or implementation strategy should change.

---

## Phase 2: Influence Planning Domain Foundation

**Purpose**: Add the deterministic local domain foundation shared by dashboard and portal integration.

- [x] T004 [P] Add company influence planning domain types in `src/features/city-view/scene/office/influence/CompanyInfluencePlanningTypes.ts`.
- [x] T005 Add `CompanyInfluencePlanningService` with fixed focus options, initial state, deterministic selection, idempotent same-focus behavior, invalid-selection handling, and dashboard summary derivation in `src/features/city-view/scene/office/influence/CompanyInfluencePlanningService.ts`.
- [x] T006 [P] Add service tests for option ordering, initial unset state, valid selection, same-focus selection, invalid selection, and advisory-only summary in `src/features/city-view/scene/office/influence/CompanyInfluencePlanningService.test.ts`.
- [x] T007 Verify the domain layer does not import Employee AI, project task, schedule, work-session, NPC, external provider, economy, payroll, dialogue, relationship, or persistence systems.

---

## Phase 3: User Story 1 - Select a Company Focus (Priority: P1) MVP

**Goal**: Let the player select exactly one current company focus from the dashboard flow.

**Independent Test**: Open the Company Dashboard flow, open influence planning, select each focus option, and verify one active focus at a time.

- [x] T008 [US1] Add local company influence plan state to `src/features/city-view/scene/office/OfficeProjectPortalTypes.ts`.
- [x] T009 [US1] Initialize local influence plan state in `src/features/city-view/scene/office/OfficeProjectPortalController.ts`.
- [x] T010 [US1] Add minimally mutating controller methods to get focus options, get current focus summary, and set the current company focus in `src/features/city-view/scene/office/OfficeProjectPortalController.ts`.
- [x] T011 [US1] Add portal view support for opening the planning view and selecting one focus option in `src/features/city-view/scene/office/OfficeProjectPortalView.ts`.
- [x] T012 [US1] Add controller/view tests covering valid focus selection, replacing the prior focus, same-focus idempotency, invalid focus handling, and close/reopen runtime state preservation in `src/features/city-view/scene/office/OfficeProjectPortalController.company-influence.test.ts`.

---

## Phase 4: User Story 2 - Show Active Focus on Dashboard (Priority: P1)

**Goal**: Surface the active focus on the Company Dashboard without breaking provider-neutral dashboard rendering.

**Independent Test**: Select a focus, return to the dashboard, and verify the current focus is visible with advisory text and no management controls.

- [x] T013 [US2] Extend provider-neutral dashboard types with current focus summary metadata in `src/features/city-view/scene/office/dashboard/CompanyDashboardTypes.ts`.
- [x] T014 [US2] Pass current focus summary into the dashboard snapshot or dashboard view using the smallest existing portal/dashboard boundary in `src/features/city-view/scene/office/OfficeProjectPortalController.ts`.
- [x] T015 [US2] Render the neutral focus state and selected current focus in `src/features/city-view/scene/office/dashboard/CompanyDashboardView.ts`.
- [x] T016 [US2] Add dashboard tests for unset focus, selected focus, advisory label rendering, and absence of assignment/editing/dialogue/project-control/direct employee-control affordances in `src/features/city-view/scene/office/dashboard/CompanyDashboardView.test.ts`.

---

## Phase 5: User Story 3 - Keep Influence Advisory and Local (Priority: P2)

**Goal**: Ensure company focus changes do not directly mutate employee, project, task, schedule, work-session, NPC, or provider state.

**Independent Test**: Snapshot relevant simulation inputs before and after focus changes and verify only focus state/advisory metadata changes.

- [x] T017 [US3] Add regression tests that focus changes do not mutate Employee AI, project task, schedule, work-session, company progression, office layout, NPC, or conversation state in `src/features/city-view/scene/office/OfficeProjectPortalController.company-influence.test.ts`.
- [x] T018 [US3] Add tests or assertions that focus selection does not call external AI/provider paths or introduce economy/payroll/dialogue/relationship controls in the touched files.
- [x] T019 [US3] Review implementation imports and update code if any influence planning path depends on forbidden simulation mutation or external provider modules.

---

## Phase 6: User Story 4 - Preserve Future Influence Extensibility (Priority: P3)

**Goal**: Keep the foundation extensible without implementing future systems.

**Independent Test**: Review contracts, types, comments, and tests to confirm future-ready metadata exists without dialogue, memory, management, economy, multiplayer, save/load, or external provider implementation.

- [x] T020 [US4] Add only minimal extension comments where helpful in `src/features/city-view/scene/office/influence/CompanyInfluencePlanningTypes.ts` or `src/features/city-view/scene/office/influence/CompanyInfluencePlanningService.ts`.
- [x] T021 [US4] Confirm dashboard UI consumes provider-neutral focus summary data and does not import the influence service implementation directly in `src/features/city-view/scene/office/dashboard/CompanyDashboardView.ts`.
- [x] T022 [US4] Update `specs/029-company-influence-planning-system/quickstart.md` if final controls differ from the planned manual validation flow.

---

## Phase 7: Validation and Manual Review

**Purpose**: Confirm the feature is complete, deterministic, local, and regression-safe.

- [x] T023 Complete manual validation using `specs/029-company-influence-planning-system/quickstart.md`.
- [x] T024 Run `npm test`.
- [x] T025 Run `npx tsc --noEmit`.
- [x] T026 Run `npm run build`.
- [x] T027 Run `git diff --check`.
- [x] T028 Run `git diff --cached --check`.
- [x] T029 Confirm existing Company Dashboard, project portal, office movement, computer interaction, NPC behavior, work sessions, and project task execution behavior remain unchanged except for the new focus planning affordance.
- [x] T030 Confirm no external AI/provider integration, economy/payroll system, dialogue system, relationship system, save/load system, management action, project control, task assignment, task completion, or direct employee-control behavior was added.

## Dependencies

- Phase 1 must complete before implementation.
- Phase 2 must complete before portal, dashboard, or UI integration.
- Phase 3 delivers the MVP focus selection slice.
- Phase 4 surfaces focus on the dashboard.
- Phase 5 must complete before final validation to preserve advisory-only behavior.
- Phase 6 preserves future extension boundaries before final validation.
- Phase 7 completes the feature.

## Parallel Example

After Phase 1, T004 and T006 may be prepared in parallel if the service contract is stable. Dashboard rendering tests and portal controller regression tests may be prepared in parallel after Phase 2, but implementation should still land phase-by-phase.

## Implementation Strategy

1. Complete setup and inspection.
2. Build the domain foundation first.
3. Deliver the MVP focus-selection flow.
4. Surface the selected focus on the dashboard.
5. Add advisory-only regression coverage.
6. Preserve future extension boundaries.
7. Run full automated and manual validation.
