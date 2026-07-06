# Tasks: Project Advisory Signals

**Input**: Design documents from `specs/034-project-advisory-signals/`
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

## Phase 1: Existing System Review

**Purpose**: Confirm the hidden advisory source and Project Dashboard boundaries before implementation changes.

- [x] T001 Inspect existing project-manager suggestion types and service in `src/features/city-view/scene/office/ai/AIProjectManagerTypes.ts` and `src/features/city-view/scene/office/ai/AIProjectManagerService.ts`.
- [x] T002 Inspect Project Dashboard provider-neutral types and internal provider in `src/features/city-view/scene/office/project-dashboard/ProjectDashboardTypes.ts` and `src/features/city-view/scene/office/project-dashboard/InternalSimulationProjectDashboardProvider.ts`.
- [x] T003 Inspect portal controller state/context wiring in `src/features/city-view/scene/office/OfficeProjectPortalController.ts` and `src/features/city-view/scene/office/OfficeProjectPortalTypes.ts`.
- [x] T004 Inspect Project Dashboard render path and tests in `src/features/city-view/scene/office/project-dashboard/ProjectDashboardView.ts`, `src/features/city-view/scene/office/OfficeProjectPortalView.ts`, and related test files.

---

## Phase 2: Advisory Read Model Foundation

**Purpose**: Add the smallest provider-neutral advisory shape needed by all user stories.

- [x] T005 Add `ProjectDashboardAdvisorySignal` types and `project_advisory` section availability support in `src/features/city-view/scene/office/project-dashboard/ProjectDashboardTypes.ts`.
- [x] T006 Initialize unavailable Project Dashboard snapshots with advisory unavailable state in `src/features/city-view/scene/office/project-dashboard/ProjectDashboardTypes.ts`.
- [x] T007 [P] Add or update type/view tests for unavailable advisory defaults in `src/features/city-view/scene/office/project-dashboard/ProjectDashboardView.test.ts`.

---

## Phase 3: User Story 1 - See Project Advisory Signals (Priority: P1)

**Goal**: Show health, top risk or neutral risk, and next attention when a matching local suggestion exists.

**Independent Test**: A provider test can pass an existing matching suggestion and verify the Project Dashboard snapshot and panel rows expose compact advisory content.

- [x] T008 [US1] Extend the internal Project Dashboard provider context with read-only project-management suggestions in `src/features/city-view/scene/office/project-dashboard/InternalSimulationProjectDashboardProvider.ts`.
- [x] T009 [US1] Map a matching `ProjectManagementSuggestion` into the selected project's advisory signal in `src/features/city-view/scene/office/project-dashboard/InternalSimulationProjectDashboardProvider.ts`.
- [x] T010 [US1] Pass existing `projectManagementSuggestions` through `createProjectDashboardContext()` in `src/features/city-view/scene/office/OfficeProjectPortalController.ts`.
- [x] T011 [US1] Add provider/controller tests for matching suggestion rendering and no suggestion generation on Project Dashboard open in `src/features/city-view/scene/office/project-dashboard/InternalSimulationProjectDashboardProvider.test.ts` and `src/features/city-view/scene/office/OfficeProjectPortalController.project-dashboard.test.ts`.

---

## Phase 4: User Story 2 - Handle Missing Advisory Data Gracefully (Priority: P1)

**Goal**: Show an honest empty state when no selected-project suggestion is available or when another project's suggestion exists.

**Independent Test**: A provider/view test can omit the suggestion map or provide a different project's suggestion and verify the advisory rows show a waiting/unavailable state.

- [x] T012 [US2] Add missing-suggestion and wrong-project advisory empty-state derivation in `src/features/city-view/scene/office/project-dashboard/InternalSimulationProjectDashboardProvider.ts`.
- [x] T013 [US2] Add view rows for advisory empty state in `src/features/city-view/scene/office/project-dashboard/ProjectDashboardView.ts`.
- [x] T014 [US2] Add tests for missing suggestion, wrong-project suggestion, and no-risk neutral advisory text in `src/features/city-view/scene/office/project-dashboard/InternalSimulationProjectDashboardProvider.test.ts` and `src/features/city-view/scene/office/project-dashboard/ProjectDashboardView.test.ts`.

---

## Phase 5: User Story 3 - Preserve Read-Only Project Observation (Priority: P2)

**Goal**: Render advisory signals without exposing management controls or mutating simulation/source state.

**Independent Test**: Snapshot provider/controller inputs before and after Project Dashboard advisory derivation/rendering and assert they are unchanged.

- [x] T015 [US3] Render compact advisory rows in the Project Dashboard Phaser panel in `src/features/city-view/scene/office/OfficeProjectPortalView.ts`.
- [x] T016 [US3] Add read-only mutation regression coverage for project, task, employee, work-session, focus, repository mapping, repository summary, and suggestion inputs in `src/features/city-view/scene/office/project-dashboard/InternalSimulationProjectDashboardProvider.test.ts`.
- [x] T017 [US3] Add tests confirming advisory rows expose no assignment, status-change, sync, credential, repository mutation, or employee-control affordances in `src/features/city-view/scene/office/project-dashboard/ProjectDashboardView.test.ts`.
- [x] T018 [US3] Confirm existing Company Dashboard source signal tests still pass without changes in `src/features/city-view/scene/office/dashboard/CompanyDashboardView.test.ts`.

---

## Phase 6: Validation and Review Readiness

**Purpose**: Prove the focused PR is safe for independent review.

- [x] T019 Run `npm test`.
- [x] T020 Run `npx tsc --noEmit`.
- [x] T021 Run `npm run build`.
- [x] T022 Run `git diff --check`.
- [x] T023 Run `git diff --cached --check`.
- [x] T024 Review final diff for scope creep and confirm no external AI calls, GitHub API calls, credentials, sync, persistence, task mutation, assignment/status changes, employee control, or management action buttons were added.

## Dependencies

- Phase 1 must complete before implementation.
- Phase 2 blocks all user-story phases.
- Phase 3 and Phase 4 can be developed together after Phase 2, but both must pass before Phase 5.
- Phase 5 depends on advisory rows from Phases 3 and 4.
- Phase 6 depends on all implementation phases.

## Parallel Opportunities

- T007 can be prepared after T005/T006 while provider implementation continues.
- T011 and T014 touch related but separable provider/view test cases and can be reviewed independently.
- T016 and T017 cover different read-only surfaces after rendering is wired.

## Implementation Strategy

1. Verify existing hidden suggestion storage and dashboard boundaries.
2. Add the smallest Project Dashboard advisory snapshot shape.
3. Pass existing suggestion state into the internal provider without generating new suggestions.
4. Render compact advisory rows through provider-neutral panel rows.
5. Add focused provider, controller, view, and read-only tests.
6. Run the full validation suite and review the diff for scope creep.
