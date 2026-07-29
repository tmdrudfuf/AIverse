# Tasks: Explicit Work Session Start Foundation

**Input**: Design documents from `specs/069-explicit-work-session-start-foundation/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Tests are required by the feature specification and must cover service, controller, view, safety, and regression behavior.

**Organization**: Tasks are grouped by user story so each story remains independently testable.

## Phase 1: Setup

**Purpose**: Establish feature docs and state pointers.

- [X] T001 Update `.specify/feature.json` to point to `specs/069-explicit-work-session-start-foundation`
- [X] T002 Update the SPECKIT managed section in `AGENTS.md` to point to `specs/069-explicit-work-session-start-foundation/plan.md`

---

## Phase 2: Foundational

**Purpose**: Create active-session domain model and deterministic service boundary.

- [X] T003 [P] Create active work-session domain types in `src/features/city-view/scene/office/active-work-sessions/ActiveWorkSessionTypes.ts`
- [X] T004 [P] Add active work-session type tests in `src/features/city-view/scene/office/active-work-sessions/ActiveWorkSessionTypes.test.ts`
- [X] T005 Create start service in `src/features/city-view/scene/office/active-work-sessions/ActiveWorkSessionStartService.ts`
- [X] T006 Add start service tests in `src/features/city-view/scene/office/active-work-sessions/ActiveWorkSessionStartService.test.ts`
- [X] T007 Add state fields for active-session start records/results in `src/features/city-view/scene/office/OfficeProjectPortalTypes.ts`
- [X] T008 Initialize active-session start state in `src/features/city-view/scene/office/OfficeProjectPortalRegistry.ts`

**Checkpoint**: Active start domain can be tested without controller or view changes.

---

## Phase 3: User Story 1 - Start a Prepared Session (Priority: P1)

**Goal**: Start one valid prepared session through an explicit human command.

**Independent Test**: Service and controller tests prove one active session is created, task becomes In Progress, employee becomes Working, and execution/mutation flags stay false.

- [X] T009 [US1] Implement valid start mapping and atomic task/employee/session/result output in `src/features/city-view/scene/office/active-work-sessions/ActiveWorkSessionStartService.ts`
- [X] T010 [US1] Add valid start, mapping, task transition, employee transition, and no-execution tests in `src/features/city-view/scene/office/active-work-sessions/ActiveWorkSessionStartService.test.ts`
- [X] T011 [US1] Wire `ActiveWorkSessionStartService` into `src/features/city-view/scene/office/OfficeProjectPortalController.ts`
- [X] T012 [US1] Add explicit start input tests in `src/features/city-view/scene/office/OfficeProjectPortalController.issue-sync.test.ts`

**Checkpoint**: A prepared session can be started with a separate input and no agent execution.

---

## Phase 4: User Story 2 - Block Unsafe Starts (Priority: P2)

**Goal**: Block stale, unsafe, unavailable, and conflicting starts without partial mutation.

**Independent Test**: Service and controller tests prove invalid inputs create no active session and leave task, employee, assignment, and prepared-session state unchanged.

- [X] T013 [US2] Implement stale, conflict, unavailable, duplicate, and malformed eligibility checks in `src/features/city-view/scene/office/active-work-sessions/ActiveWorkSessionStartService.ts`
- [X] T014 [US2] Add eligibility, idempotency, stale repeated-start, duplicate prevention, atomicity, and safety tests in `src/features/city-view/scene/office/active-work-sessions/ActiveWorkSessionStartService.test.ts`
- [X] T015 [US2] Add input-boundary and stale-project regression coverage in `src/features/city-view/scene/office/OfficeProjectPortalController.issue-sync.test.ts`

**Checkpoint**: Invalid starts are explicit and safe.

---

## Phase 5: User Story 3 - View Active Session State (Priority: P3)

**Goal**: Render active-session results with safe wording and layout priority.

**Independent Test**: View tests prove active, already-started, blocked, unavailable, long text, multiple rows, and row-priority behavior.

- [X] T016 [P] Create active-session display formatter in `src/features/city-view/scene/office/active-work-sessions/ActiveWorkSessionView.ts`
- [X] T017 [P] Add active-session view tests in `src/features/city-view/scene/office/active-work-sessions/ActiveWorkSessionView.test.ts`
- [X] T018 [US3] Integrate active-session rows into `src/features/city-view/scene/office/OfficeProjectPortalView.ts`
- [X] T019 [US3] Add dashboard rendering and layout priority tests in `src/features/city-view/scene/office/OfficeProjectPortalView.test.ts`

**Checkpoint**: Active-session state is visible without implying agent execution.

---

## Phase 6: Polish & Validation

**Purpose**: Complete docs, task checkboxes, and validation.

- [X] T020 Update `specs/069-explicit-work-session-start-foundation/quickstart.md` with final focused test commands and expected UI behavior
- [X] T021 Mark completed tasks in `specs/069-explicit-work-session-start-foundation/tasks.md`
- [X] T022 Run focused tests for active-session, controller, and dashboard files
- [X] T023 Run full validation: `npm test`, `npx tsc --noEmit`, `npm run build`, `git diff --check`, `git diff --cached --check`
- [X] T024 Commit the completed implementation locally with message `feat: add explicit work session start`
- [X] T025 Run independent configured Claude review against the exact committed HEAD and fix blocking findings until Approved
- [X] T026 Run final exact-HEAD provenance checks: `git rev-parse HEAD`, `git status --short`, `git log -1 --oneline`

---

## Dependencies & Execution Order

### Phase Dependencies

- Phase 1 must complete before implementation.
- Phase 2 blocks all user stories.
- US1 is the MVP and should complete before unsafe-state expansions.
- US2 depends on the service/controller seams from US1.
- US3 depends on result collections from US1/US2.
- Polish depends on all user stories.

### Parallel Opportunities

- T003 and T004 can proceed together after setup.
- T016 and T017 can proceed together after result types exist.
- Focused tests can be run independently by module.

## Implementation Strategy

### MVP First

1. Complete setup and foundational active-session types/service.
2. Implement valid start flow.
3. Validate with focused service/controller tests.

### Incremental Delivery

1. Add safety and idempotency checks.
2. Add dashboard presentation.
3. Run focused and full validation.
4. Commit and request independent review.
