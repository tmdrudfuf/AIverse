# Tasks: Confirmed Employee Assignment Foundation

**Input**: Design documents from `specs/067-confirmed-employee-assignment-foundation/`

**Prerequisites**: spec.md, plan.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Required by the feature request.

## Phase 1: Setup

**Purpose**: Establish feature pointers and documentation.

- [X] T001 Update `.specify/feature.json` to point at `specs/067-confirmed-employee-assignment-foundation`
- [X] T002 Update `AGENTS.md` Spec Kit pointer to `specs/067-confirmed-employee-assignment-foundation/plan.md`
- [X] T003 Create Spec Kit docs in `specs/067-confirmed-employee-assignment-foundation/`

---

## Phase 2: Foundational Domain

**Purpose**: Confirmed assignment request, record, result, identity, immutability, and validation.

- [X] T004 [P] Create confirmed-assignment domain types in `src/features/city-view/scene/office/confirmed-assignments/ConfirmedEmployeeAssignmentTypes.ts`
- [X] T005 [P] Add confirmed-assignment type immutability and ID tests in `src/features/city-view/scene/office/confirmed-assignments/ConfirmedEmployeeAssignmentTypes.test.ts`
- [X] T006 Implement assignment validation, ProjectTask assignee mapping, idempotency, and atomic outcomes in `src/features/city-view/scene/office/confirmed-assignments/ConfirmedEmployeeAssignmentService.ts`
- [X] T007 Add assignment eligibility, mapping, identity, idempotency, atomicity, existing-state safety, and no-execution tests in `src/features/city-view/scene/office/confirmed-assignments/ConfirmedEmployeeAssignmentService.test.ts`

---

## Phase 3: User Story 1 - Confirm recommended employee (Priority: P1)

**Goal**: Explicitly confirm one recommended employee for one existing promoted ProjectTask without starting work.

**Independent Test**: Controller test proves an eligible explicit command sets ProjectTask `assigneeId`/`assignee`, records one assignment, leaves status `Todo`, and creates no work session or employee working state.

- [X] T008 [US1] Add confirmed-assignment record/result state to `src/features/city-view/scene/office/OfficeProjectPortalTypes.ts`
- [X] T009 [US1] Initialize confirmed-assignment state in `src/features/city-view/scene/office/OfficeProjectPortalRegistry.ts`
- [X] T010 [US1] Wire `ConfirmedEmployeeAssignmentService` into `src/features/city-view/scene/office/OfficeProjectPortalController.ts`
- [X] T011 [US1] Add explicit dashboard confirm-assignment command handling after promotion and before sync fallback
- [X] T012 [US1] Add controller tests proving eligible confirmation updates only the selected ProjectTask and is idempotent

---

## Phase 4: User Story 2 - Block unsafe assignments (Priority: P1)

**Goal**: Revalidate current task/recommendation/employee/work-session state and block unsafe or stale confirmation.

**Independent Test**: Controller and service tests prove blocked inputs produce safe results and no mutation.

- [X] T013 [US2] Add stale recommendation, project mismatch, employee missing/unavailable/conflict, started/completed task, existing assignee, and malformed provenance handling
- [X] T014 [US2] Add service tests for recommendation status policy and employee conflict policy
- [X] T015 [US2] Add controller tests for stale project selection, manual sync reachability, no GitHub calls, no AI calls, no work sessions, and no employee mutation

---

## Phase 5: User Story 3 - Display assignment confirmation safely (Priority: P2)

**Goal**: Show assignment records/results as low-priority dashboard rows with explicit non-execution wording.

**Independent Test**: View tests prove safe wording, bounded text, multiple results, `+N more`, row priority, and no overlap.

- [X] T016 [P] Implement confirmed-assignment display rows in `src/features/city-view/scene/office/confirmed-assignments/ConfirmedEmployeeAssignmentView.ts`
- [X] T017 [P] Add confirmed-assignment display tests in `src/features/city-view/scene/office/confirmed-assignments/ConfirmedEmployeeAssignmentView.test.ts`
- [X] T018 [US3] Integrate confirmed-assignment rows into `src/features/city-view/scene/office/OfficeProjectPortalView.ts`
- [X] T019 [US3] Add dashboard assignment row and layout regression tests in `src/features/city-view/scene/office/OfficeProjectPortalView.test.ts`

---

## Phase 6: Validation, Review, Commit

- [X] T020 Run focused confirmed-assignment type tests
- [X] T021 Run focused confirmed-assignment service tests
- [X] T022 Run focused controller/view tests
- [X] T023 Run `npm test`
- [X] T024 Run `npx tsc --noEmit`
- [X] T025 Run `npm run build`
- [X] T026 Run `git diff --check`
- [X] T027 Run `git diff --cached --check`
- [X] T028 Commit complete implementation locally
- [X] T029 Run independent Claude review against exact committed HEAD
- [X] T030 If review requests changes, fix blocking findings, revalidate, recommit, and re-review until Approved

## Dependencies & Execution Order

- Phase 1 before source implementation.
- Phase 2 before controller or UI integration.
- US1 and US2 are MVP and must pass before US3 is considered complete.
- Confirmed assignment rows remain lower priority than promotion result rows.

## Parallel Opportunities

- T004 and T005 can run in parallel once names are stable.
- T016 and T017 can run after result collection shape is stable.

## Implementation Strategy

Implement pure domain/result types first; then validation and ProjectTask assignee mapping; then controller command/state integration; then dashboard display and layout tests.
