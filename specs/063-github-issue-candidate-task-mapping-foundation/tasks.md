# Tasks: GitHub Issue Candidate Task Mapping Foundation

**Input**: Design documents from `specs/063-github-issue-candidate-task-mapping-foundation/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Required by the feature request.

## Phase 1: Setup

**Purpose**: Establish the feature pointer and module boundary.

- [X] T001 Update `.specify/feature.json` to point at `specs/063-github-issue-candidate-task-mapping-foundation`
- [X] T002 Update `AGENTS.md` Spec Kit pointer to `specs/063-github-issue-candidate-task-mapping-foundation/plan.md`

---

## Phase 2: Foundational

**Purpose**: Candidate task model and mapping rules.

- [X] T003 [P] Create Candidate Task types and factories in `src/features/city-view/scene/office/candidate-tasks/CandidateTaskTypes.ts`
- [X] T004 [P] Add type/factory immutability tests in `src/features/city-view/scene/office/candidate-tasks/CandidateTaskTypes.test.ts`
- [X] T005 [P] Implement deterministic inference and mapping in `src/features/city-view/scene/office/candidate-tasks/CandidateTaskMapper.ts`
- [X] T006 [P] Add mapper tests for labels, priority, type, determinism, immutability, empty issue collections, unavailable issue sync, and duplicate prevention in `src/features/city-view/scene/office/candidate-tasks/CandidateTaskMapper.test.ts`
- [X] T007 Implement Candidate Task service in `src/features/city-view/scene/office/candidate-tasks/CandidateTaskService.ts`
- [X] T008 Add service tests in `src/features/city-view/scene/office/candidate-tasks/CandidateTaskService.test.ts`

---

## Phase 3: User Story 1 - Map synchronized issues into candidate tasks (Priority: P1)

**Goal**: Store candidate task collections derived from issue sync collections.

**Independent Test**: Controller tests prove candidate tasks are created from existing issue sync results and no duplicate tasks are produced.

- [X] T009 [US1] Add `candidateTaskCollections` to `ProjectPortalState` in `src/features/city-view/scene/office/OfficeProjectPortalTypes.ts`
- [X] T010 [US1] Initialize candidate task state in `src/features/city-view/scene/office/OfficeProjectPortalRegistry.ts`
- [X] T011 [US1] Wire `CandidateTaskService` into `src/features/city-view/scene/office/OfficeProjectPortalController.ts`
- [X] T012 [US1] Extend controller issue-sync flow to map candidate tasks only from the synchronized collection in `src/features/city-view/scene/office/OfficeProjectPortalController.ts`
- [X] T013 [US1] Add controller tests in `src/features/city-view/scene/office/OfficeProjectPortalController.issue-sync.test.ts`

---

## Phase 4: User Story 2 - Infer provider-neutral task metadata (Priority: P1)

**Goal**: Keep priority and type inference deterministic and isolated.

**Independent Test**: Mapper tests cover all documented label rules and fallback behavior.

- [X] T014 [US2] Verify inference coverage in `src/features/city-view/scene/office/candidate-tasks/CandidateTaskMapper.test.ts`
- [X] T015 [US2] Keep inference isolated from controller/view code in `src/features/city-view/scene/office/candidate-tasks/CandidateTaskMapper.ts`

---

## Phase 5: User Story 3 - Display candidate tasks separately from raw issues (Priority: P2)

**Goal**: Render candidate tasks as a separate AIverse projection on the project dashboard.

**Independent Test**: View tests prove distinct raw issue and candidate task rows.

- [X] T016 [P] Create candidate task display row helpers in `src/features/city-view/scene/office/candidate-tasks/CandidateTaskView.ts`
- [X] T017 [P] Add candidate task view tests in `src/features/city-view/scene/office/candidate-tasks/CandidateTaskView.test.ts`
- [X] T018 [US3] Integrate candidate task rows into project dashboard rendering in `src/features/city-view/scene/office/OfficeProjectPortalView.ts`
- [X] T019 [US3] Add dashboard rendering tests in `src/features/city-view/scene/office/OfficeProjectPortalView.test.ts`

---

## Phase 6: Polish and Validation

- [X] T020 Run focused candidate-task tests
- [X] T021 Run focused controller and view tests
- [X] T022 Run `npm test`
- [X] T023 Run `npx tsc --noEmit`
- [X] T024 Run `npm run build`
- [X] T025 Run `git diff --check`
- [X] T026 Run `git diff --cached --check`
- [X] T027 Run independent review with `node tools/agent-workflow/cli.js run-review --state .agent-workflow/063-independent-review-state.json --timeout-ms 600000`
- [X] T028 Commit locally after validation and review approval

## Dependencies & Execution Order

- Phase 1 before all implementation.
- Phase 2 before controller/view integration.
- US1 and US2 are the MVP and can be tested through mapper and controller tests.
- US3 depends on candidate task collections existing in state.
- Validation and independent review happen after all implementation tasks.

## Parallel Opportunities

- T003-T006 can proceed together by file once type names are agreed.
- T016-T017 can proceed alongside controller tests after CandidateTaskCollection shape is stable.

## Implementation Strategy

Deliver the mapper and service first, then derive collections in the controller, then render a small dashboard summary. Preserve Spec 062 issue sync behavior and avoid new provider requests.
