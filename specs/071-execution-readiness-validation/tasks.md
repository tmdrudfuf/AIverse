# Tasks: Execution Readiness Validation Foundation

**Input**: Design documents from `specs/071-execution-readiness-validation/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Tests are required for domain, service, controller, dashboard, layout, and runtime-safety behavior.

## Phase 1: Setup

- [X] T001 Update `.specify/feature.json` to point to `specs/071-execution-readiness-validation`
- [X] T002 Update the SPECKIT managed section in `AGENTS.md` to point to `specs/071-execution-readiness-validation/plan.md`

---

## Phase 2: Foundational

- [X] T003 [P] Create readiness domain types in `src/features/city-view/scene/office/execution-readiness/ExecutionReadinessTypes.ts`
- [X] T004 [P] Add readiness type tests in `src/features/city-view/scene/office/execution-readiness/ExecutionReadinessTypes.test.ts`
- [X] T005 Create readiness service in `src/features/city-view/scene/office/execution-readiness/ExecutionReadinessService.ts`
- [X] T006 Add readiness service tests in `src/features/city-view/scene/office/execution-readiness/ExecutionReadinessService.test.ts`
- [X] T007 Add readiness state fields in `src/features/city-view/scene/office/OfficeProjectPortalTypes.ts`
- [X] T008 Initialize readiness state in `src/features/city-view/scene/office/OfficeProjectPortalRegistry.ts`

---

## Phase 3: User Story 1 - Evaluate Execution Readiness (Priority: P1)

**Goal**: Produce a `Ready` technical result from one valid Execution Plan without approval or execution.

**Independent Test**: Domain and controller tests prove one explicit readiness action creates checks/result with all safety flags false and no source mutation.

- [X] T009 [US1] Implement valid readiness mapping and check aggregation in `src/features/city-view/scene/office/execution-readiness/ExecutionReadinessService.ts`
- [X] T010 [US1] Add valid `Ready`, check coverage, immutability, and no-approval tests in `src/features/city-view/scene/office/execution-readiness/ExecutionReadinessService.test.ts`
- [X] T011 [US1] Wire readiness service into `src/features/city-view/scene/office/OfficeProjectPortalController.ts`
- [X] T012 [US1] Add explicit readiness input tests in `src/features/city-view/scene/office/OfficeProjectPortalController.issue-sync.test.ts`

---

## Phase 4: User Story 2 - Report Blocked Readiness (Priority: P2)

**Goal**: Block stale, missing, unsafe, cross-project, and malformed readiness inputs with deterministic checks/reasons.

**Independent Test**: Focused tests prove each invalid current-state condition creates no partial source mutation and stale prior readiness is not reused.

- [X] T013 [US2] Implement blocked/failed reason handling in `src/features/city-view/scene/office/execution-readiness/ExecutionReadinessService.ts`
- [X] T014 [US2] Add missing/stale/project-isolation/repository/role/commands/mutation-scope tests in `src/features/city-view/scene/office/execution-readiness/ExecutionReadinessService.test.ts`
- [X] T015 [US2] Add stale repeated-readiness and project-switch controller regressions in `src/features/city-view/scene/office/OfficeProjectPortalController.issue-sync.test.ts`

---

## Phase 5: User Story 3 - View Readiness State (Priority: P3)

**Goal**: Render readiness state safely without implying human approval or execution and without layout regressions.

**Independent Test**: View tests prove Ready/Blocked/Failed wording, check counts, primary reason, and protected row priorities.

- [X] T016 [P] Create readiness display formatter in `src/features/city-view/scene/office/execution-readiness/ExecutionReadinessView.ts`
- [X] T017 [P] Add readiness display tests in `src/features/city-view/scene/office/execution-readiness/ExecutionReadinessView.test.ts`
- [X] T018 [US3] Integrate readiness rows into `src/features/city-view/scene/office/OfficeProjectPortalView.ts`
- [X] T019 [US3] Add dashboard wording and layout tests in `src/features/city-view/scene/office/OfficeProjectPortalView.test.ts`

---

## Phase 6: Polish & Validation

- [X] T020 Add runtime-safety import/string checks in `src/features/city-view/scene/office/execution-readiness/ExecutionReadinessService.test.ts`
- [X] T021 Run focused readiness/controller/dashboard tests
- [X] T022 Run full validation: `npm test`, `npx tsc --noEmit`, `npm run build`, `git diff --check`, `git diff --cached --check`
- [X] T023 Commit implementation locally with message `feat: add execution readiness validation`
- [X] T024 Run independent configured Claude review against exact HEAD and fix blocking findings until Approved
- [X] T025 Complete task checklist only after validation and review evidence exists
- [X] T026 Run exact-HEAD provenance checks: `git rev-parse HEAD`, `git status --short`, `git log -1 --oneline`

---

## Dependencies & Execution Order

- Setup and foundational tasks block all user stories.
- US1 is the MVP.
- US2 depends on the service seams from US1.
- US3 depends on result/check collections from US1/US2.
- Polish depends on all user stories.

## Parallel Opportunities

- T003 and T004 can proceed together.
- T016 and T017 can proceed together after result types exist.
- Focused tests can run independently by module.

## MVP First

1. Add readiness types and service.
2. Create valid `Ready` evaluation.
3. Wire explicit controller action.
4. Add dashboard visibility.
5. Expand blocked/failed and safety coverage.
