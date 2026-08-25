# Tasks: External Project Development Request Draft

**Input**: Design documents from `specs/127-external-project-development-request-draft/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Focused Vitest coverage is included because the feature changes portal state, rendering, and browser persistence behavior.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm current external draft, repository identity, dashboard action, rendering, and browser persistence files.

- [x] T001 Inspect external draft, repository identity edit, dashboard action, lower row rendering, and browser persistence in `src/features/city-view/scene/office/OfficeProjectPortalController.ts`, `src/features/city-view/scene/office/OfficeProjectPortalView.ts`, `src/features/city-view/scene/office/OfficeProjectPortalTypes.ts`, and `src/features/city-view/scene/office/browser-session/BrowserOfficeSessionService.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add shared development request draft model and helper before user-story behavior.

- [x] T002 Add external development request draft types in `src/features/city-view/scene/office/external-development-requests/ExternalProjectDevelopmentRequestTypes.ts`
- [x] T003 Add idempotent draft creation and display-row helpers in `src/features/city-view/scene/office/external-development-requests/ExternalProjectDevelopmentRequestService.ts` and `src/features/city-view/scene/office/external-development-requests/ExternalProjectDevelopmentRequestView.ts`
- [x] T004 Add development request draft state to `src/features/city-view/scene/office/OfficeProjectPortalTypes.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin.

---

## Phase 3: User Story 1 - Draft a development request (Priority: P1) MVP

**Goal**: A configured external project dashboard action creates and displays one local-only development request draft.

**Independent Test**: Configure the external project identity, activate the dashboard action, and inspect request draft state plus dashboard rows.

### Tests for User Story 1

- [x] T005 [US1] Add service coverage for creating a configured external project development request draft in `src/features/city-view/scene/office/external-development-requests/ExternalProjectDevelopmentRequestService.test.ts`
- [x] T006 [US1] Add controller coverage for dashboard action creating the request draft in `src/features/city-view/scene/office/OfficeProjectPortalController.project-dashboard.test.ts`
- [x] T007 [US1] Add view coverage for request draft display rows in `src/features/city-view/scene/office/external-development-requests/ExternalProjectDevelopmentRequestView.test.ts`

### Implementation for User Story 1

- [x] T008 [US1] Wire configured external project dashboard action to create a development request draft in `src/features/city-view/scene/office/OfficeProjectPortalController.ts`
- [x] T009 [US1] Render request draft status in Project Dashboard lower rows in `src/features/city-view/scene/office/OfficeProjectPortalView.ts`

**Checkpoint**: User Story 1 is independently testable.

---

## Phase 4: User Story 2 - Keep draft creation idempotent (Priority: P2)

**Goal**: Repeated dashboard activation reuses the existing development request draft.

**Independent Test**: Activate the dashboard action twice and confirm exactly one request draft remains for the external project.

### Tests for User Story 2

- [x] T010 [US2] Add repeated activation coverage in `src/features/city-view/scene/office/OfficeProjectPortalController.project-dashboard.test.ts`

### Implementation for User Story 2

- [x] T011 [US2] Ensure request draft creation reuses existing project draft state in `src/features/city-view/scene/office/external-development-requests/ExternalProjectDevelopmentRequestService.ts`

**Checkpoint**: User Story 2 is independently testable.

---

## Phase 5: User Story 3 - Persist the draft in browser session state (Priority: P3)

**Goal**: Development request drafts survive browser office session save/restore.

**Independent Test**: Create a request draft, save/restore browser session state, and inspect the restored dashboard draft row.

### Tests for User Story 3

- [x] T012 [US3] Add browser session persistence coverage for request drafts in `src/features/city-view/scene/office/OfficeProjectPortalController.project-dashboard.test.ts`

### Implementation for User Story 3

- [x] T013 [US3] Persist and restore request drafts in `src/features/city-view/scene/office/browser-session/BrowserOfficeSessionTypes.ts` and `src/features/city-view/scene/office/browser-session/BrowserOfficeSessionService.ts`

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Documentation and task closeout.

- [x] T014 Review quickstart and contract alignment in `specs/127-external-project-development-request-draft/quickstart.md` and `specs/127-external-project-development-request-draft/contracts/development-request-draft.md`
- [x] T015 Review diff readiness without running validation commands in this runtime

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup completion and blocks user stories.
- **User Stories (Phase 3+)**: Depend on Foundational phase completion; implement in P1 -> P2 -> P3 order.
- **Polish (Final Phase)**: Depends on desired user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational.
- **User Story 2 (P2)**: Builds on the same creation helper as US1.
- **User Story 3 (P3)**: Builds on the persistence path from US1.

## Parallel Opportunities

- T005 and T007 affect different files and can be drafted independently after T003.
- Most controller and persistence tasks should run sequentially because they touch shared state flow.

## Implementation Strategy

1. Complete setup and foundational helpers.
2. Add US1 tests, then implement dashboard action and rendering.
3. Add US2 test, then verify idempotent helper behavior.
4. Add US3 test, then persist request drafts through browser session state.
5. Mark completed tasks and stop before validation per ADOS handoff policy.
