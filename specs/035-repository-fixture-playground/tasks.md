# Tasks: Repository Fixture Playground

**Input**: Design documents from `specs/035-repository-fixture-playground/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Required by the specification for fixture determinism, dashboard consumption, read-only boundaries, and no external calls.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Phase 1: Setup

**Purpose**: Confirm feature boundaries and existing source paths before implementation.

- [x] T001 Inspect existing mock GitHub provider and repository summary types in `src/features/city-view/scene/office/github/MockGitHubRepositoryProvider.ts` and `src/features/city-view/scene/office/github/GitHubRepositoryTypes.ts`.
- [x] T002 Inspect Company Dashboard and Project Dashboard source tests in `src/features/city-view/scene/office/dashboard/InternalSimulationDashboardProvider.test.ts` and `src/features/city-view/scene/office/project-dashboard/GitHubProjectDashboardProvider.test.ts`.

---

## Phase 2: Foundational

**Purpose**: Add deterministic fixture coverage before wiring richer data.

- [x] T003 [P] Add mock provider fixture determinism and unavailable-project tests in `src/features/city-view/scene/office/github/MockGitHubRepositoryProvider.test.ts`.
- [x] T004 [P] Add or update repository snapshot mapping tests for richer issue, pull request, check, source status, and recent activity fields in `src/features/city-view/scene/office/github/GitHubRepositoryTypes.test.ts`.

---

## Phase 3: User Story 1 - Observe Fixture Repository Signals (Priority: P1) MVP

**Goal**: The existing dashboard flow can consume richer fixture-backed repository data for mapped projects.

**Independent Test**: Provider tests show Company Dashboard source signals and Project Dashboard source rows consume fixture-backed fresh repository data.

- [x] T005 [US1] Enrich deterministic Daily Proof fixture data in `src/features/city-view/scene/office/github/MockGitHubRepositoryProvider.ts`.
- [x] T006 [US1] Update Project Dashboard provider tests for fixture-backed repository name, branch, issues, pull requests, checks, recent commit, and latest activity in `src/features/city-view/scene/office/project-dashboard/GitHubProjectDashboardProvider.test.ts`.
- [x] T007 [US1] Update Company Dashboard source signal tests for fixture-backed fresh source status in `src/features/city-view/scene/office/dashboard/InternalSimulationDashboardProvider.test.ts`.

---

## Phase 4: User Story 2 - Exercise Non-Happy Repository States (Priority: P1)

**Goal**: Local fixtures cover stale, failing-check, and unavailable source states without external refresh or sync.

**Independent Test**: Tests can request fixture project ids that return stale, failing-check, and unavailable summaries.

- [x] T008 [US2] Add deterministic stale and failing-check fixture summaries in `src/features/city-view/scene/office/github/MockGitHubRepositoryProvider.ts`.
- [x] T009 [US2] Add mock provider tests for stale source, failing checks, and unknown-project unavailable summaries in `src/features/city-view/scene/office/github/MockGitHubRepositoryProvider.test.ts`.
- [x] T010 [US2] Add Project Dashboard provider tests for stale source status and failing-check health from fixture-style summaries in `src/features/city-view/scene/office/project-dashboard/GitHubProjectDashboardProvider.test.ts`.
- [x] T011 [US2] Add Company Dashboard source signal tests for stale and unavailable fixture states in `src/features/city-view/scene/office/dashboard/InternalSimulationDashboardProvider.test.ts`.

---

## Phase 5: User Story 3 - Preserve Read-Only Local Boundaries (Priority: P2)

**Goal**: Fixture-backed dashboard reads remain local, deterministic, and mutation-free.

**Independent Test**: Tests prove fixture reads clone data, do not call external network primitives, and do not mutate dashboard/advisory inputs.

- [x] T012 [US3] Add no-external-call and cloned-fixture mutation-safety tests in `src/features/city-view/scene/office/github/MockGitHubRepositoryProvider.test.ts`.
- [x] T013 [US3] Add controller/dashboard read-only regression coverage for fixture-backed repository summaries in `src/features/city-view/scene/office/OfficeProjectPortalController.project-dashboard.test.ts`.
- [x] T014 [US3] Confirm Project Advisory Signals are not generated from fixture repository data in `src/features/city-view/scene/office/project-dashboard/GitHubProjectDashboardProvider.test.ts`.

---

## Phase 6: Polish & Validation

**Purpose**: Complete task bookkeeping and full validation.

- [x] T015 Update `specs/035-repository-fixture-playground/tasks.md` task statuses after implementation.
- [x] T016 Run `npm test`, `npx tsc --noEmit`, `npm run build`, `git diff --check`, and `git diff --cached --check`.

---

## Dependencies & Execution Order

- Phase 1 must complete before implementation.
- Phase 2 establishes focused tests before fixture changes.
- Phase 3 is the MVP and should complete before non-happy scenarios.
- Phase 4 depends on the fixture dataset shape from Phase 3.
- Phase 5 depends on fixture reads from Phases 3 and 4.
- Phase 6 depends on all implementation tasks.

## Parallel Opportunities

- T003 and T004 can be written in parallel.
- Dashboard test updates in T006 and T007 can be reviewed independently after T005.
- T009, T010, and T011 touch separate test files after T008.

## Implementation Strategy

1. Confirm existing provider/source paths.
2. Add focused tests for the richer local fixture behavior.
3. Enrich the mock provider fixture dataset without changing real provider contracts.
4. Verify Company Dashboard and Project Dashboard consume fixture summaries through existing paths.
5. Prove read-only/no-external-call boundaries.
6. Run the full validation suite.
