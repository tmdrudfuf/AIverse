# Tasks: Project Dashboard System

**Input**: Design documents from specs/030-project-dashboard-system/
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

## Phase 1: Setup and Existing System Review

**Purpose**: Confirm current Company Dashboard, Project, Employee AI, Company Influence, and portal architecture before implementation changes.

- [x] T001 Inspect `src/features/city-view/scene/office/dashboard/CompanyDashboardTypes.ts`, `src/features/city-view/scene/office/dashboard/CompanyDashboardView.ts`, `src/features/city-view/scene/office/dashboard/InternalSimulationDashboardProvider.ts`, `src/features/city-view/scene/office/OfficeProjectPortalController.ts`, `src/features/city-view/scene/office/OfficeProjectPortalTypes.ts`, and `src/features/city-view/scene/office/OfficeProjectPortalView.ts`.
- [x] T002 Inspect current project/task, Employee AI, schedule, company progression, company influence, work-session/activity, Employee Insight, and Employee Knowledge source files used by dashboard and portal flows.
- [x] T003 Inspect relevant tests under `src/features/city-view/scene/office/dashboard/`, `src/features/city-view/scene/office/influence/`, and `src/features/city-view/scene/office/OfficeProjectPortalController.*.test.ts` to confirm current test patterns.
- [x] T004 Update `specs/030-project-dashboard-system/plan.md` if inspection shows source touchpoints or implementation strategy should change.

---

## Phase 2: Project Dashboard Provider Foundation

**Purpose**: Add provider-neutral project detail models and the internal simulation provider foundation.

- [x] T005 [P] Add provider-neutral Project Dashboard types in `src/features/city-view/scene/office/project-dashboard/ProjectDashboardTypes.ts`.
- [x] T006 Add `InternalSimulationProjectDashboardProvider` to derive project detail snapshots from existing internal simulation data in `src/features/city-view/scene/office/project-dashboard/InternalSimulationProjectDashboardProvider.ts`.
- [x] T007 [P] Add provider tests for project list derivation, selected project snapshot derivation, missing project handling, empty task/employee/blocker states, health derivation, and future source metadata boundaries in `src/features/city-view/scene/office/project-dashboard/InternalSimulationProjectDashboardProvider.test.ts`.
- [x] T008 Verify the provider layer does not import GitHub, external provider, credential, issue creation, task mutation, management, economy, payroll, dialogue, relationship, quest, multiplayer, or save/load systems.

---

## Phase 3: User Story 1 - Open a Project Dashboard (Priority: P1) MVP

**Goal**: Let the player open a read-only Project Dashboard for one selected project from the Company Dashboard flow.

**Independent Test**: Open the Company Dashboard, select one project, verify the Project Dashboard opens for that project, and return to the Company Dashboard.

- [x] T009 [US1] Add local selected Project Dashboard view state to `src/features/city-view/scene/office/OfficeProjectPortalTypes.ts`.
- [x] T010 [US1] Initialize and reset selected Project Dashboard state in `src/features/city-view/scene/office/OfficeProjectPortalController.ts`.
- [x] T011 [US1] Add controller methods to list project dashboard entries, open one selected project dashboard, return to Company Dashboard, and get the selected project dashboard snapshot in `src/features/city-view/scene/office/OfficeProjectPortalController.ts`.
- [x] T012 [US1] Add portal view support for opening one project dashboard and returning to the Company Dashboard in `src/features/city-view/scene/office/OfficeProjectPortalView.ts`.
- [x] T013 [US1] Add controller/view tests covering project selection, selected project identity, missing project handling, return behavior, and close/reopen behavior in `src/features/city-view/scene/office/OfficeProjectPortalController.project-dashboard.test.ts`.

---

## Phase 4: User Story 2 - Understand Project Health and Work (Priority: P1)

**Goal**: Render project detail sections for work, employees, blockers, activity, health, and advisory focus using provider-neutral data.

**Independent Test**: Open a populated project and verify all available project detail sections render from source data with readable empty states where data is missing.

- [x] T014 [US2] Add `ProjectDashboardView` for read-only project detail rendering in `src/features/city-view/scene/office/project-dashboard/ProjectDashboardView.ts`.
- [x] T015 [US2] Render project name, status, progress, active work, employees, blockers, activity, health, related focus, next suggested focus, and source metadata empty states in `src/features/city-view/scene/office/project-dashboard/ProjectDashboardView.ts`.
- [x] T016 [US2] Integrate `ProjectDashboardView` into `src/features/city-view/scene/office/OfficeProjectPortalView.ts` using existing modal/portal conventions.
- [x] T017 [US2] Add view tests for populated sections, partial data, unavailable project state, empty active work, empty employees, neutral blockers, and advisory focus text in `src/features/city-view/scene/office/project-dashboard/ProjectDashboardView.test.ts`.
- [x] T017a [US2] Include existing company progression signals in internal project dashboard recent activity derivation.
- [x] T017b [US2] Include supported name-only task assignees in internal project dashboard related employee derivation.
- [x] T017c [US2] Include open company progression milestones in internal project dashboard health derivation.

---

## Phase 5: User Story 3 - Preserve Read-Only Project Observation (Priority: P2)

**Goal**: Ensure opening and reviewing the Project Dashboard does not directly mutate project, task, employee, schedule, work-session, company influence, progression, NPC, or external provider state.

**Independent Test**: Snapshot relevant state before and after opening/closing Project Dashboard and verify only local selected-view state changes.

- [x] T018 [US3] Add regression tests that opening, viewing, returning from, and closing Project Dashboard do not mutate project task status, employee AI, schedule, work-session, company influence, company progression, NPC, Insight, Knowledge, or conversation state in `src/features/city-view/scene/office/OfficeProjectPortalController.project-dashboard.test.ts`.
- [x] T019 [US3] Add tests or assertions that no task assignment, task editing, issue creation, GitHub connection, management, dialogue, or direct employee-control affordance is exposed in Project Dashboard UI files.
- [x] T020 [US3] Review implementation imports and update code if any project dashboard path depends on forbidden mutation, external provider, credential, or management modules.

---

## Phase 6: User Story 4 - Preserve Future GitHub Mapping (Priority: P3)

**Goal**: Keep the Project Dashboard provider-neutral and future-ready without implementing GitHub.

**Independent Test**: Review contracts, types, tests, and UI imports to confirm future source metadata exists, the UI is provider-neutral, and no GitHub/external integration behavior exists.

- [x] T021 [US4] Add minimal extension comments where helpful in `src/features/city-view/scene/office/project-dashboard/ProjectDashboardTypes.ts`.
- [x] T022 [US4] Confirm Project Dashboard UI consumes provider-neutral snapshot data and does not import the internal simulation provider directly in `src/features/city-view/scene/office/project-dashboard/ProjectDashboardView.ts`.
- [x] T023 [US4] Update `specs/030-project-dashboard-system/quickstart.md` if final controls differ from the planned manual validation flow.

---

## Phase 7: Validation and Manual Review

**Purpose**: Confirm the feature is complete, read-only, provider-neutral, and regression-safe.

- [x] T024 Complete manual validation using `specs/030-project-dashboard-system/quickstart.md`.
- [x] T025 Run `npm test`.
- [x] T026 Run `npx tsc --noEmit`.
- [x] T027 Run `npm run build`.
- [x] T028 Run `git diff --check`.
- [x] T029 Run `git diff --cached --check`.
- [x] T030 Confirm existing Company Dashboard, Company Influence, project portal, office movement, computer interaction, Employee Insight, Employee Knowledge, NPC behavior, work sessions, and project task execution behavior remain unchanged except for the new read-only project inspection path.
- [x] T031 Confirm no GitHub integration, external provider call, credential flow, repository sync, issue creation, task assignment, task editing, task completion, management action, dialogue system, relationship system, save/load system, economy/payroll system, or direct employee-control behavior was added.

## Dependencies

- Phase 1 must complete before implementation.
- Phase 2 must complete before portal or UI integration.
- Phase 3 delivers the MVP selected-project dashboard flow.
- Phase 4 completes the player-facing project understanding slice.
- Phase 5 must complete before final validation to preserve read-only behavior.
- Phase 6 preserves future GitHub mapping boundaries before final validation.
- Phase 7 completes the feature.

## Parallel Example

After Phase 1, T005 and T007 may be prepared in parallel if the provider contract is stable. Project Dashboard view tests and portal controller regression tests may be prepared in parallel after Phase 2, but implementation should still land phase-by-phase.

## Implementation Strategy

1. Complete setup and inspection.
2. Build the provider-neutral project detail foundation.
3. Deliver the MVP selected-project flow.
4. Render project health and work context.
5. Add read-only regression coverage.
6. Preserve future GitHub mapping boundaries.
7. Run full automated and manual validation.
