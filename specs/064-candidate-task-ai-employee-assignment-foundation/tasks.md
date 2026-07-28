# Tasks: Candidate Task AI Employee Assignment Foundation

**Input**: Design documents from `specs/064-candidate-task-ai-employee-assignment-foundation/`

**Prerequisites**: plan.md, spec.md, quickstart.md

**Tests**: Required by the feature request.

## Phase 1: Setup

**Purpose**: Establish feature pointers and documentation.

- [X] T001 Update `.specify/feature.json` to point at `specs/064-candidate-task-ai-employee-assignment-foundation`
- [X] T002 Update `AGENTS.md` Spec Kit pointer to `specs/064-candidate-task-ai-employee-assignment-foundation/plan.md`

---

## Phase 2: Foundational Domain

**Purpose**: Assignment recommendation model and employee capability adapter.

- [X] T003 [P] Create assignment domain types in `src/features/city-view/scene/office/candidate-assignments/CandidateAssignmentTypes.ts`
- [X] T004 [P] Add assignment type immutability tests in `src/features/city-view/scene/office/candidate-assignments/CandidateAssignmentTypes.test.ts`
- [X] T005 [P] Implement employee capability adapter in `src/features/city-view/scene/office/candidate-assignments/EmployeeCapabilityProfile.ts`
- [X] T006 [P] Add capability adapter tests in `src/features/city-view/scene/office/candidate-assignments/EmployeeCapabilityProfile.test.ts`
- [X] T007 [P] Implement deterministic matcher in `src/features/city-view/scene/office/candidate-assignments/CandidateAssignmentMatcher.ts`
- [X] T008 [P] Add matcher tests in `src/features/city-view/scene/office/candidate-assignments/CandidateAssignmentMatcher.test.ts`
- [X] T009 Implement assignment service in `src/features/city-view/scene/office/candidate-assignments/CandidateAssignmentService.ts`
- [X] T010 Add assignment service tests in `src/features/city-view/scene/office/candidate-assignments/CandidateAssignmentService.test.ts`

---

## Phase 3: User Story 1 - Recommend employees for candidate tasks (Priority: P1)

**Goal**: Store assignment recommendation collections derived from candidate task collections and current employees.

**Independent Test**: Controller tests prove recommendations are derived without mutating tasks, employees, or work sessions.

- [X] T011 [US1] Add assignment recommendation collections to `ProjectPortalState` in `src/features/city-view/scene/office/OfficeProjectPortalTypes.ts`
- [X] T012 [US1] Initialize assignment recommendation state in `src/features/city-view/scene/office/OfficeProjectPortalRegistry.ts`
- [X] T013 [US1] Wire `CandidateAssignmentService` into `src/features/city-view/scene/office/OfficeProjectPortalController.ts`
- [X] T014 [US1] Derive recommendations after candidate task mapping in `src/features/city-view/scene/office/OfficeProjectPortalController.ts`
- [X] T015 [US1] Add controller tests in `src/features/city-view/scene/office/OfficeProjectPortalController.issue-sync.test.ts`

---

## Phase 4: User Story 2 - Honest no-match and unavailable states (Priority: P1)

**Goal**: Preserve explicit no employees, no match, closed task, and unavailable candidate states.

**Independent Test**: Service and controller tests cover unavailable candidate collections and no employee pools.

- [X] T016 [US2] Add no-match and unavailable service coverage in `src/features/city-view/scene/office/candidate-assignments/CandidateAssignmentService.test.ts`
- [X] T017 [US2] Add stale/unavailable controller coverage in `src/features/city-view/scene/office/OfficeProjectPortalController.issue-sync.test.ts`

---

## Phase 5: User Story 3 - Display recommendations safely (Priority: P2)

**Goal**: Render assignment recommendations as low-priority dashboard proposal rows.

**Independent Test**: View tests prove row text, no active-work wording, and layout priority.

- [X] T018 [P] Implement assignment display rows in `src/features/city-view/scene/office/candidate-assignments/CandidateAssignmentView.ts`
- [X] T019 [P] Add assignment display row tests in `src/features/city-view/scene/office/candidate-assignments/CandidateAssignmentView.test.ts`
- [X] T020 [US3] Integrate assignment rows into `src/features/city-view/scene/office/OfficeProjectPortalView.ts`
- [X] T021 [US3] Add dashboard recommendation tests in `src/features/city-view/scene/office/OfficeProjectPortalView.test.ts`

---

## Phase 6: Validation, Review, Commit

- [X] T022 Run focused capability tests
- [X] T023 Run focused matcher/service tests
- [X] T024 Run focused controller/view tests
- [X] T025 Run `npm test`
- [X] T026 Run `npx tsc --noEmit`
- [X] T027 Run `npm run build`
- [X] T028 Run `git diff --check`
- [X] T029 Run `git diff --cached --check`
- [ ] T030 Commit complete implementation locally
- [ ] T031 Run independent Claude review against exact committed HEAD
- [ ] T032 If review requests changes, fix blocking findings, revalidate, recommit, and re-review until Approved

## Dependencies & Execution Order

- Phase 1 before source implementation.
- Phase 2 before controller or UI integration.
- US1 and US2 are MVP and must pass before US3 is considered complete.
- Assignment rows remain lower priority than candidate rows and issue detail rows.

## Parallel Opportunities

- T003-T008 can be implemented by file once the type names are stable.
- T018-T019 can proceed after `CandidateAssignmentCollection` shape is stable.

## Implementation Strategy

Implement pure types, capability mapping, and matching first; then wire controller state; then add dashboard rows. Keep all behavior deterministic and local.
