# Tasks: Candidate Detail Approve Defer Reject Controls

**Input**: Design documents from `specs/106-candidate-detail-approve-defer-reject-controls/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Focused Vitest coverage is included for controller and view behavior.

## Phase 1: Setup

**Purpose**: Point Spec Kit metadata at this feature.

- [x] T001 Update `.specify/feature.json` to point at `specs/106-candidate-detail-approve-defer-reject-controls`
- [x] T002 Update `AGENTS.md` Spec Kit pointer to `specs/106-candidate-detail-approve-defer-reject-controls/plan.md`

---

## Phase 2: Foundational

**Purpose**: Add detail-only decision inputs.

- [x] T003 Add candidate detail decision input flags in `src/features/city-view/scene/office/OfficeProjectPortalController.ts`
- [x] T004 Add keyboard capture and scene input plumbing in `src/features/city-view/scene/office/OfficeActionInputController.ts` and `src/features/city-view/scene/office/CompanyOfficeScene.ts`

---

## Phase 3: User Story 1 - Decide from Candidate Detail (Priority: P1) MVP

**Goal**: A player can approve, defer, or reject the selected candidate from candidate detail.

**Independent Test**: Open candidate detail, press each valid decision action, and verify the selected candidate promotion status updates while detail remains open.

- [x] T005 [US1] Add controller tests for candidate detail Approve, Defer, and Reject in `src/features/city-view/scene/office/OfficeProjectPortalController.project-dashboard.test.ts`
- [x] T006 [US1] Implement candidate detail decision recording in `src/features/city-view/scene/office/OfficeProjectPortalController.ts`
- [x] T007 [US1] Update candidate detail status/instruction rendering in `src/features/city-view/scene/office/OfficeProjectPortalView.ts`
- [x] T008 [US1] Add view tests for candidate detail decision controls in `src/features/city-view/scene/office/OfficeProjectPortalView.test.ts`

---

## Phase 4: User Story 2 - Preserve Dashboard Progression Controls (Priority: P2)

**Goal**: Existing dashboard candidate controls keep their current meanings.

**Independent Test**: Press Enter and Space on the Project Dashboard and verify the existing progression/status-cycle behavior remains unchanged.

- [x] T009 [US2] Preserve existing Project Dashboard control tests in `src/features/city-view/scene/office/OfficeProjectPortalController.project-dashboard.test.ts`
- [x] T010 [US2] Keep detail-only decision inputs out of Project Dashboard progression handling in `src/features/city-view/scene/office/OfficeProjectPortalController.ts`

---

## Phase 5: User Story 3 - Fail Closed for Invalid Detail Decisions (Priority: P3)

**Goal**: Invalid or stale detail decisions do not mutate unrelated state.

**Independent Test**: Use stale or unavailable promotion context in candidate detail, press decision controls, and verify no decision is recorded.

- [x] T011 [US3] Add stale/unavailable detail decision guard tests in `src/features/city-view/scene/office/OfficeProjectPortalController.project-dashboard.test.ts`
- [x] T012 [US3] Guard missing candidate detail promotion context in `src/features/city-view/scene/office/OfficeProjectPortalController.ts`

---

## Phase 6: Polish

**Purpose**: Final task bookkeeping and validation handoff.

- [x] T013 Mark completed tasks in `specs/106-candidate-detail-approve-defer-reject-controls/tasks.md`

## Dependencies & Execution Order

- Phase 1 before implementation.
- Phase 2 before user story work.
- US1 before US2/US3 because it introduces the detail decision surface.
- US2 and US3 can be validated independently after US1 exists.

## Parallel Opportunities

- T005 and T008 touch different test files and can be prepared in parallel.
- T003 and T004 touch different input plumbing files after the target input shape is known.

## Implementation Strategy

1. Complete Spec Kit metadata setup.
2. Add detail-only inputs and keyboard plumbing.
3. Implement detail decision recording through existing promotion rules.
4. Add regression guards for dashboard behavior and stale/unavailable detail decisions.
5. Do not run validation in this ADOS runtime.
