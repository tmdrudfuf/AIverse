# Tasks: External Project ADOS Run Preparation

**Input**: Design documents from `specs/128-external-project-ados-run-preparation/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Focused Vitest coverage is included because the feature changes portal state, rendering, and browser persistence behavior.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm current external request draft, dashboard action, lower row rendering, and browser persistence files.

- [X] T001 Inspect external development request, dashboard action, lower row rendering, and browser persistence in `src/features/city-view/scene/office/OfficeProjectPortalController.ts`, `src/features/city-view/scene/office/OfficeProjectPortalView.ts`, `src/features/city-view/scene/office/OfficeProjectPortalTypes.ts`, and `src/features/city-view/scene/office/browser-session/BrowserOfficeSessionService.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add shared ADOS run preparation model and helper before user-story behavior.

- [X] T002 Add external ADOS run preparation types in `src/features/city-view/scene/office/external-ados-run-preparation/ExternalProjectAdosRunPreparationTypes.ts`
- [X] T003 Add idempotent preparation creation and display-row helpers in `src/features/city-view/scene/office/external-ados-run-preparation/ExternalProjectAdosRunPreparationService.ts` and `src/features/city-view/scene/office/external-ados-run-preparation/ExternalProjectAdosRunPreparationView.ts`
- [X] T004 Add ADOS run preparation state to `src/features/city-view/scene/office/OfficeProjectPortalTypes.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin.

---

## Phase 3: User Story 1 - Prepare an ADOS run handoff (Priority: P1) MVP

**Goal**: A configured external project dashboard action creates and displays one local-only ADOS run preparation after a development request draft exists.

**Independent Test**: Configure the external project identity, create the development request draft, activate the dashboard action again, and inspect preparation state plus dashboard rows.

### Tests for User Story 1

- [X] T005 [US1] Add service coverage for creating an external project ADOS run preparation in `src/features/city-view/scene/office/external-ados-run-preparation/ExternalProjectAdosRunPreparationService.test.ts`
- [X] T006 [US1] Add controller coverage for dashboard action creating the preparation in `src/features/city-view/scene/office/OfficeProjectPortalController.project-dashboard.test.ts`
- [X] T007 [US1] Add view coverage for preparation display rows in `src/features/city-view/scene/office/external-ados-run-preparation/ExternalProjectAdosRunPreparationView.test.ts`

### Implementation for User Story 1

- [X] T008 [US1] Wire configured external project dashboard action to create an ADOS run preparation after a request draft exists in `src/features/city-view/scene/office/OfficeProjectPortalController.ts`
- [X] T009 [US1] Render ADOS run preparation status in Project Dashboard lower rows in `src/features/city-view/scene/office/OfficeProjectPortalView.ts`

**Checkpoint**: User Story 1 is independently testable.

---

## Phase 4: User Story 2 - Keep preparation idempotent (Priority: P2)

**Goal**: Repeated dashboard activation reuses the existing ADOS run preparation.

**Independent Test**: Activate the dashboard action repeatedly and confirm exactly one preparation remains for the external project.

### Tests for User Story 2

- [X] T010 [US2] Add repeated activation coverage in `src/features/city-view/scene/office/OfficeProjectPortalController.project-dashboard.test.ts`

### Implementation for User Story 2

- [X] T011 [US2] Ensure preparation creation reuses existing project preparation state in `src/features/city-view/scene/office/external-ados-run-preparation/ExternalProjectAdosRunPreparationService.ts`

**Checkpoint**: User Story 2 is independently testable.

---

## Phase 5: User Story 3 - Persist the preparation in browser session state (Priority: P3)

**Goal**: ADOS run preparations survive browser office session save/restore.

**Independent Test**: Create a preparation, save/restore browser session state, and inspect the restored dashboard preparation row.

### Tests for User Story 3

- [X] T012 [US3] Add browser session persistence coverage for ADOS run preparations in `src/features/city-view/scene/office/OfficeProjectPortalController.project-dashboard.test.ts`

### Implementation for User Story 3

- [X] T013 [US3] Persist and restore ADOS run preparations in `src/features/city-view/scene/office/browser-session/BrowserOfficeSessionTypes.ts` and `src/features/city-view/scene/office/browser-session/BrowserOfficeSessionService.ts`

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Documentation and task closeout.

- [X] T014 Review quickstart and contract alignment in `specs/128-external-project-ados-run-preparation/quickstart.md` and `specs/128-external-project-ados-run-preparation/contracts/ados-run-preparation.md`
- [X] T015 Review diff readiness without running validation commands in this runtime

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup completion and blocks user stories.
- **User Stories (Phase 3+)**: Depend on Foundational phase completion; implement in P1 -> P2 -> P3 order.
- **Polish (Final Phase)**: Depends on desired user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational and after a development request draft exists.
- **User Story 2 (P2)**: Builds on the same creation helper as US1.
- **User Story 3 (P3)**: Builds on the persistence path from US1.

## Parallel Opportunities

- T005 and T007 affect different files and can be drafted independently after T003.
- Most controller and persistence tasks should run sequentially because they touch shared state flow.

## Implementation Strategy

1. Complete setup and foundational helpers.
2. Add US1 tests, then implement dashboard action and rendering.
3. Add US2 test, then verify idempotent helper behavior.
4. Add US3 test, then persist preparations through browser session state.
5. Mark completed tasks and stop before validation per ADOS handoff policy.
