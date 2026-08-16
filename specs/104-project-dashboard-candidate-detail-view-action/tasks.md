# Tasks: Project Dashboard Candidate Detail View Action

**Input**: Design documents from `specs/104-project-dashboard-candidate-detail-view-action/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Focused Vitest coverage is included for controller and view behavior.

## Phase 1: Setup

**Purpose**: Point Spec Kit metadata at this feature.

- [x] T001 Update `.specify/feature.json` to point at `specs/104-project-dashboard-candidate-detail-view-action`
- [x] T002 Update `AGENTS.md` Spec Kit pointer to `specs/104-project-dashboard-candidate-detail-view-action/plan.md`

---

## Phase 2: Foundational

**Purpose**: Add read-only candidate detail state.

- [x] T003 Add candidate-detail view mode and selected candidate identity to `src/features/city-view/scene/office/OfficeProjectPortalTypes.ts`
- [x] T004 Initialize selected candidate detail state in `src/features/city-view/scene/office/OfficeProjectPortalRegistry.ts`

---

## Phase 3: User Story 1 - Inspect a Candidate from Project Dashboard (Priority: P1) MVP

**Goal**: A player can open read-only detail for the selected Project Dashboard candidate.

**Independent Test**: Open a Project Dashboard with candidate data, press Space/action, and verify candidate detail opens for the selected candidate.

- [x] T005 [US1] Add controller tests for candidate detail navigation in `src/features/city-view/scene/office/OfficeProjectPortalController.project-dashboard.test.ts`
- [x] T006 [US1] Add view tests for candidate detail content in `src/features/city-view/scene/office/OfficeProjectPortalView.test.ts`
- [x] T007 [US1] Implement candidate detail open/return behavior in `src/features/city-view/scene/office/OfficeProjectPortalController.ts`
- [x] T008 [US1] Render candidate detail content in `src/features/city-view/scene/office/OfficeProjectPortalView.ts`

---

## Phase 4: User Story 2 - Preserve Existing Candidate Progression Controls (Priority: P2)

**Goal**: Existing Enter-based candidate progression remains available from Project Dashboard.

**Independent Test**: Press Enter on a selected candidate promotion and verify the existing progression path is still reached instead of candidate detail.

- [x] T009 [US2] Add controller regression coverage for Enter preserving candidate progression in `src/features/city-view/scene/office/OfficeProjectPortalController.project-dashboard.test.ts`
- [x] T010 [US2] Keep candidate detail on Space/action only in `src/features/city-view/scene/office/OfficeProjectPortalController.ts`

---

## Phase 5: User Story 3 - Fail Closed for Missing Candidate Data (Priority: P3)

**Goal**: Missing or stale candidate references stay on Project Dashboard without data mutation.

**Independent Test**: Use stale candidate selection, press Space/action, and verify no unrelated detail opens and data remains unchanged.

- [x] T011 [US3] Add stale candidate detail guard test in `src/features/city-view/scene/office/OfficeProjectPortalController.project-dashboard.test.ts`
- [x] T012 [US3] Guard missing candidate data in `src/features/city-view/scene/office/OfficeProjectPortalController.ts`

---

## Phase 6: Polish

**Purpose**: Final task bookkeeping and validation handoff.

- [x] T013 Mark completed tasks in `specs/104-project-dashboard-candidate-detail-view-action/tasks.md`

## Dependencies & Execution Order

- Phase 1 before implementation.
- Phase 2 before user story work.
- US1 before US2/US3 because it introduces the navigation surface.
- US2 and US3 can be validated independently after US1.

## Parallel Opportunities

- T005 and T006 touch different test files and can be prepared in parallel.
- US2 and US3 tests can be reasoned about independently after US1 exists.

## Implementation Strategy

1. Complete Spec Kit metadata setup.
2. Add state and candidate detail view mode.
3. Implement candidate detail navigation and rendering.
4. Add regression guards for preserved Enter behavior and stale candidate data.
5. Do not run validation in this ADOS runtime.
