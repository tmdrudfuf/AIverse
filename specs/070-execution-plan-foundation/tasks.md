# Tasks: Execution Plan Foundation

**Input**: Design documents from `specs/070-execution-plan-foundation/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Tests are required by the feature specification and must cover service, controller, view, safety, and regression behavior.

**Organization**: Tasks are grouped by user story so each story remains independently testable.

## Phase 1: Setup

**Purpose**: Establish feature docs and state pointers.

- [X] T001 Update `.specify/feature.json` to point to `specs/070-execution-plan-foundation`
- [X] T002 Update the SPECKIT managed section in `AGENTS.md` to point to `specs/070-execution-plan-foundation/plan.md`

---

## Phase 2: Foundational

**Purpose**: Create execution-plan domain model and deterministic service boundary.

- [X] T003 [P] Create execution-plan domain types in `src/features/city-view/scene/office/execution-plans/ExecutionPlanTypes.ts`
- [X] T004 [P] Add execution-plan type tests in `src/features/city-view/scene/office/execution-plans/ExecutionPlanTypes.test.ts`
- [X] T005 Create execution-plan service in `src/features/city-view/scene/office/execution-plans/ExecutionPlanService.ts`
- [X] T006 Add execution-plan service tests in `src/features/city-view/scene/office/execution-plans/ExecutionPlanService.test.ts`
- [X] T007 Add state fields for execution-plan records/results in `src/features/city-view/scene/office/OfficeProjectPortalTypes.ts`
- [X] T008 Initialize execution-plan state in `src/features/city-view/scene/office/OfficeProjectPortalRegistry.ts`

**Checkpoint**: Execution-plan domain can be tested without controller or view changes.

---

## Phase 3: User Story 1 - Create an Execution Plan (Priority: P1)

**Goal**: Create one immutable plan from one valid active work session through an explicit human command.

**Independent Test**: Service and controller tests prove one plan is created, execution flags remain false, and task/employee/session state is unchanged.

- [X] T009 [US1] Implement valid plan mapping and atomic plan/result output in `src/features/city-view/scene/office/execution-plans/ExecutionPlanService.ts`
- [X] T010 [US1] Add valid creation, mapping, immutability, and no-execution tests in `src/features/city-view/scene/office/execution-plans/ExecutionPlanService.test.ts`
- [X] T011 [US1] Wire `ExecutionPlanService` into `src/features/city-view/scene/office/OfficeProjectPortalController.ts`
- [X] T012 [US1] Add explicit plan input tests in `src/features/city-view/scene/office/OfficeProjectPortalController.issue-sync.test.ts`

**Checkpoint**: An active work session can produce one execution plan with a separate input and no execution.

---

## Phase 4: User Story 2 - Block Invalid Plans (Priority: P2)

**Goal**: Block stale, unsafe, unavailable, and conflicting plan creation without partial mutation.

**Independent Test**: Service and controller tests prove invalid inputs create no plan and leave all source records unchanged.

- [X] T013 [US2] Implement stale, unavailable, duplicate, malformed, missing-repository, missing-worktree, missing-spec, and missing-role checks in `src/features/city-view/scene/office/execution-plans/ExecutionPlanService.ts`
- [X] T014 [US2] Add eligibility, idempotency, stale repeated-plan, duplicate prevention, atomicity, project-isolation, and safety tests in `src/features/city-view/scene/office/execution-plans/ExecutionPlanService.test.ts`
- [X] T015 [US2] Add input-boundary and stale-project regression coverage in `src/features/city-view/scene/office/OfficeProjectPortalController.issue-sync.test.ts`

**Checkpoint**: Invalid plan creation is explicit and safe.

---

## Phase 5: User Story 3 - View Execution Plan State (Priority: P3)

**Goal**: Render execution-plan results with safe wording and layout priority.

**Independent Test**: View tests prove created, already-existing, blocked, failed, long text, multiple rows, and row-priority behavior.

- [X] T016 [P] Create execution-plan display formatter in `src/features/city-view/scene/office/execution-plans/ExecutionPlanView.ts`
- [X] T017 [P] Add execution-plan view tests in `src/features/city-view/scene/office/execution-plans/ExecutionPlanView.test.ts`
- [X] T018 [US3] Integrate execution-plan rows into `src/features/city-view/scene/office/OfficeProjectPortalView.ts`
- [X] T019 [US3] Add dashboard rendering and layout priority tests in `src/features/city-view/scene/office/OfficeProjectPortalView.test.ts`

**Checkpoint**: Execution-plan state is visible without implying readiness or execution.

---

## Phase 6: Polish & Validation

**Purpose**: Complete docs, task checkboxes, and validation.

- [X] T020 Update `specs/070-execution-plan-foundation/quickstart.md` with final focused test commands and expected UI behavior
- [X] T021 Mark completed tasks in `specs/070-execution-plan-foundation/tasks.md`
- [X] T022 Run focused tests for execution-plan, controller, and dashboard files
- [X] T023 Run full validation: `npm test`, `npx tsc --noEmit`, `npm run build`, `git diff --check`, `git diff --cached --check`
- [ ] T024 Commit the completed implementation locally with message `feat: add execution plan foundation`
- [ ] T025 Run independent configured Claude review against the exact committed HEAD and fix blocking findings until Approved
- [ ] T026 Run final exact-HEAD provenance checks: `git rev-parse HEAD`, `git status --short`, `git log -1 --oneline`

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

1. Complete setup and foundational execution-plan types/service.
2. Implement valid plan creation flow.
3. Validate with focused service/controller tests.

### Incremental Delivery

1. Add safety and idempotency checks.
2. Add dashboard presentation.
3. Run focused and full validation.
4. Commit and request independent review.
