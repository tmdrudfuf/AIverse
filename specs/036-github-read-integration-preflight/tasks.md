# Tasks: GitHub Read Integration Preflight

**Input**: Design documents from `specs/036-github-read-integration-preflight/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Required for provider boundary, status mapping, no-network/auth/sync/mutation guardrails, and fixture/dashboard compatibility.

## Phase 1: Setup

**Purpose**: Confirm current GitHub/dashboard boundaries before code changes.

- [x] T001 Inspect `src/features/city-view/scene/office/github/MockGitHubRepositoryProvider.ts`, `GitHubRepositoryProvider.ts`, `GitHubRepositoryService.ts`, and `GitHubRepositoryTypes.ts`.
- [x] T002 Inspect Company Dashboard and Project Dashboard source tests in `src/features/city-view/scene/office/dashboard/InternalSimulationDashboardProvider.test.ts` and `src/features/city-view/scene/office/project-dashboard/GitHubProjectDashboardProvider.test.ts`.

---

## Phase 2: Foundational

**Purpose**: Encode the approved public read summary boundary without adding network behavior.

- [x] T003 Add approved public read summary field metadata in `src/features/city-view/scene/office/github/GitHubRepositoryTypes.ts`.
- [x] T004 [P] Add boundary metadata tests in `src/features/city-view/scene/office/github/GitHubRepositoryTypes.test.ts`.

---

## Phase 3: User Story 1 - Define Public Repository Read Boundary (Priority: P1) MVP

**Goal**: Future public reads are constrained to existing summary-level fields.

**Independent Test**: Type tests confirm the approved field list maps to current summary data and excludes raw API/auth/sync/mutation fields.

- [x] T005 [US1] Add tests for allowed public-read fields and summary-level mapping expectations in `src/features/city-view/scene/office/github/GitHubRepositoryTypes.test.ts`.
- [x] T006 [US1] Confirm fixture provider remains compatible with the same summary contract in `src/features/city-view/scene/office/github/MockGitHubRepositoryProvider.test.ts`.

---

## Phase 4: User Story 2 - Define Error and Availability States (Priority: P1)

**Goal**: Display-safe unavailable/rate-limited/offline/network-error behavior is covered before real network code exists.

**Independent Test**: Tests map source states and provider errors into display-safe repository summaries without credentials or retry behavior.

- [x] T007 [US2] Add source status mapping tests for rate-limited, offline, stale, unavailable, unknown, and unauthenticated states in `src/features/city-view/scene/office/github/GitHubRepositoryTypes.test.ts`.
- [x] T008 [US2] Add provider error fallback tests in `src/features/city-view/scene/office/github/GitHubRepositoryService.test.ts`.

---

## Phase 5: User Story 3 - Guard Read-Only Provider Interchangeability (Priority: P2)

**Goal**: Preflight tests prevent accidental network/auth/sync/mutation behavior.

**Independent Test**: Tests prove current provider/service paths do not call `fetch`, do not expose mutation controls, and preserve dashboard/advisory source boundaries.

- [x] T009 [US3] Add no-network/auth/sync/mutation guard tests in `src/features/city-view/scene/office/github/GitHubRepositoryService.test.ts`.
- [x] T010 [US3] Add dashboard compatibility assertions for fixture summaries in `src/features/city-view/scene/office/project-dashboard/GitHubProjectDashboardProvider.test.ts`.
- [x] T011 [US3] Confirm Company Dashboard source signal behavior remains provider-neutral in `src/features/city-view/scene/office/dashboard/InternalSimulationDashboardProvider.test.ts`.

---

## Phase 6: Polish & Validation

**Purpose**: Complete bookkeeping and validation.

- [x] T012 Update `specs/036-github-read-integration-preflight/tasks.md` task statuses after implementation.
- [x] T013 Run `npm test`, `npx tsc --noEmit`, `npm run build`, `git diff --check`, and `git diff --cached --check`.

---

## Dependencies & Execution Order

- Phase 1 must complete before code changes.
- Phase 2 establishes the contract metadata used by later tests.
- Phase 3 and Phase 4 can proceed after Phase 2.
- Phase 5 depends on provider/service guard tests from earlier phases.
- Phase 6 depends on all implementation tasks.

## Parallel Opportunities

- T004 can run alongside T003 review work once the intended field list is clear.
- T007 and T008 touch different test files.
- T010 and T011 touch separate dashboard test files.

## Implementation Strategy

1. Keep the feature as a preflight guardrail slice.
2. Encode only summary-level public read fields.
3. Add tests around mapping, source states, provider interchangeability, and no network/auth/sync/mutation behavior.
4. Avoid real provider implementation, `fetch`, credentials, sync, persistence, UI, and dashboard redesign.
