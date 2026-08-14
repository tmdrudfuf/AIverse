# Tasks: Project Dashboard Task Board Entry Action

**Input**: Design documents from `/specs/097-project-dashboard-task-board-entry-action/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Tests are included because the feature changes controller navigation and rendered row state.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Align Spec Kit pointer and existing ignore coverage.

- [x] T001 Update `.specify/feature.json` to point at `specs/097-project-dashboard-task-board-entry-action`
- [x] T002 Verify repository ignore files already cover Node/TypeScript build artifacts in `.gitignore`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add dashboard Active Work selection state shared by controller and view.

- [x] T003 Add `selectedProjectDashboardActiveWorkIndex` to `src/features/city-view/scene/office/OfficeProjectPortalTypes.ts`
- [x] T004 Initialize and reset `selectedProjectDashboardActiveWorkIndex` in `src/features/city-view/scene/office/OfficeProjectPortalRegistry.ts` and `src/features/city-view/scene/office/OfficeProjectPortalController.ts`

---

## Phase 3: User Story 1 - Open a Task from Project Dashboard Active Work (Priority: P1) MVP

**Goal**: A player can select a visible Project Dashboard Active Work row and open the matching existing task detail.

**Independent Test**: Open a project dashboard with loaded active work, move selection, press Enter or Space, and verify task detail opens for the same task.

### Tests for User Story 1

- [x] T005 [US1] Add controller tests for active-work selection and entry navigation in `src/features/city-view/scene/office/OfficeProjectPortalController.project-dashboard.test.ts`
- [x] T006 [US1] Add view row tests for selected Active Work highlighting in `src/features/city-view/scene/office/project-dashboard/ProjectDashboardView.test.ts`

### Implementation for User Story 1

- [x] T007 [US1] Add selected Active Work row metadata to `src/features/city-view/scene/office/project-dashboard/ProjectDashboardView.ts`
- [x] T008 [US1] Render selected Active Work rows and input hint in `src/features/city-view/scene/office/OfficeProjectPortalView.ts`
- [x] T009 [US1] Implement Project Dashboard Active Work selection movement and task-detail entry in `src/features/city-view/scene/office/OfficeProjectPortalController.ts`

**Checkpoint**: User Story 1 should be functionally complete.

---

## Phase 4: User Story 2 - Preserve Dashboard Read-Only Behavior (Priority: P2)

**Goal**: The entry action performs navigation only and fails closed when no matching task target exists.

**Independent Test**: Use the entry action with and without a resolvable active task and compare data state before and after.

### Tests for User Story 2

- [x] T010 [US2] Add non-mutation and stale-target controller tests in `src/features/city-view/scene/office/OfficeProjectPortalController.project-dashboard.test.ts`

### Implementation for User Story 2

- [x] T011 [US2] Guard stale or missing Active Work targets in `src/features/city-view/scene/office/OfficeProjectPortalController.ts`

**Checkpoint**: User Story 2 should be functionally complete.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final task bookkeeping and handoff.

- [x] T012 Mark all completed 097 tasks in `specs/097-project-dashboard-task-board-entry-action/tasks.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- Phase 1 has no dependencies.
- Phase 2 depends on Phase 1.
- User Story 1 depends on Phase 2.
- User Story 2 depends on User Story 1.
- Polish depends on completed user stories.

### User Story Dependencies

- User Story 1 (P1): can start after foundational selection state exists.
- User Story 2 (P2): depends on the entry action from User Story 1.

### Parallel Opportunities

- T005 and T006 touch different test files and can be prepared in parallel.
- T007 and T008 touch different view files but T008 consumes T007 output.

## Implementation Strategy

### MVP First

1. Complete Phase 1.
2. Complete Phase 2.
3. Complete User Story 1.
4. Confirm the task entry action uses existing task detail state.

### Incremental Delivery

1. Add selection state.
2. Add highlighted row rendering.
3. Add navigation to existing task detail.
4. Add read-only and stale-target guards.
