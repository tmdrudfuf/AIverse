# Tasks: Browser Office Session Save Restore

**Input**: Design documents from `/specs/105-browser-office-session-save-restore/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Tests are included because the feature changes persistence and restore behavior.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish feature documentation and active Spec Kit pointer.

- [X] T001 Update `.specify/feature.json` to point at `specs/105-browser-office-session-save-restore`
- [X] T002 Update `AGENTS.md` SPECKIT pointer to `specs/105-browser-office-session-save-restore/plan.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Define the browser session snapshot boundary used by all stories.

- [X] T003 [P] Add browser office session snapshot types in `src/features/city-view/scene/office/browser-session/BrowserOfficeSessionTypes.ts`
- [X] T004 [P] Add browser office session persistence tests in `src/features/city-view/scene/office/browser-session/BrowserOfficeSessionService.test.ts`
- [X] T005 Implement save/load/restore service in `src/features/city-view/scene/office/browser-session/BrowserOfficeSessionService.ts`

**Checkpoint**: Browser session persistence can save, load, and ignore invalid snapshots without controller wiring.

---

## Phase 3: User Story 1 - Restore Active Office Work (Priority: P1) MVP

**Goal**: Fresh office state restores active work sessions and visible task/employee status.

**Independent Test**: Seed browser storage with active work data, create portal state, and verify work sessions, task status, and employee status are restored.

### Tests for User Story 1

- [X] T006 [US1] Add active work restore tests in `src/features/city-view/scene/office/OfficeProjectPortalController.browser-session.test.ts`

### Implementation for User Story 1

- [X] T007 [US1] Wire snapshot restoration into `src/features/city-view/scene/office/OfficeProjectPortalRegistry.ts`
- [X] T008 [US1] Wire browser session service construction into `src/features/city-view/scene/office/OfficeProjectPortalController.ts`

**Checkpoint**: User Story 1 should be independently restorable from saved browser data.

---

## Phase 4: User Story 2 - Save Session Workflow Results (Priority: P2)

**Goal**: Controller saves restorable workflow records after session-related state changes and restored duplicate starts remain guarded.

**Independent Test**: Drive active work or seed workflow state, save it, restore a fresh controller, and verify duplicate start returns already started.

### Tests for User Story 2

- [X] T009 [US2] Add save and duplicate restored start tests in `src/features/city-view/scene/office/OfficeProjectPortalController.browser-session.test.ts`

### Implementation for User Story 2

- [X] T010 [US2] Persist office session snapshots after relevant controller workflow mutations in `src/features/city-view/scene/office/OfficeProjectPortalController.ts`

**Checkpoint**: Saved workflow records restore with duplicate active-work protection.

---

## Phase 5: User Story 3 - Recover Safely From Missing Or Bad Saved State (Priority: P3)

**Goal**: Missing, inaccessible, stale, and malformed storage never prevents default office startup.

**Independent Test**: Use malformed and throwing storage adapters and verify default state creation and save attempts do not throw.

### Tests for User Story 3

- [X] T011 [US3] Add fail-open restore and save tests in `src/features/city-view/scene/office/browser-session/BrowserOfficeSessionService.test.ts`

### Implementation for User Story 3

- [X] T012 [US3] Harden browser storage adapter handling in `src/features/city-view/scene/office/browser-session/BrowserOfficeSessionService.ts`

**Checkpoint**: Bad browser storage is ignored safely.

---

## Final Phase: Polish & Cross-Cutting Concerns

**Purpose**: Documentation and task completion.

- [X] T013 Mark all completed tasks in `specs/105-browser-office-session-save-restore/tasks.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Setup completion
- **User Stories (Phase 3+)**: Depend on Foundational phase completion
- **Polish**: Depends on completed selected user stories

### User Story Dependencies

- **User Story 1 (P1)**: Starts after Foundational
- **User Story 2 (P2)**: Depends on User Story 1 controller restore wiring
- **User Story 3 (P3)**: Depends on Foundational and can be completed before or after User Story 2

### Parallel Opportunities

- T003 and T004 can be developed in parallel.
- T006 can be drafted while T007/T008 are implemented if the snapshot contract is stable.

## Implementation Strategy

### MVP First

1. Complete Setup and Foundational tasks.
2. Complete User Story 1 restore path.
3. Add User Story 2 save and duplicate guard behavior.
4. Add User Story 3 hardening.

### Validation

Required validation commands are documented in quickstart, but this runtime must not run them per ADOS handoff.
