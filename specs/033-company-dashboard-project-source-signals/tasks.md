# Tasks: Company Dashboard Project Source Signals

**Input**: Design documents from `specs/033-company-dashboard-project-source-signals/`
**Prerequisites**: `plan.md`, `spec.md`

## Phase 1: Existing System Review

**Purpose**: Confirm source boundaries and dashboard patterns before implementation changes.

- [x] T001 Inspect `src/features/city-view/scene/office/dashboard/CompanyDashboardTypes.ts`, `src/features/city-view/scene/office/dashboard/InternalSimulationDashboardProvider.ts`, and `src/features/city-view/scene/office/dashboard/CompanyDashboardView.ts`.
- [x] T002 Inspect existing GitHub mapping and source-status helpers in `src/features/city-view/scene/office/github/GitHubRepositoryTypes.ts`.
- [x] T003 Inspect Project Dashboard source metadata mapping in `src/features/city-view/scene/office/project-dashboard/GitHubProjectDashboardProvider.ts` and `src/features/city-view/scene/office/project-dashboard/ProjectDashboardTypes.ts`.
- [x] T004 Inspect dashboard test patterns in `src/features/city-view/scene/office/dashboard/InternalSimulationDashboardProvider.test.ts` and `src/features/city-view/scene/office/dashboard/CompanyDashboardView.test.ts`.

---

## Phase 2: Source Signal Read Model Foundation

**Purpose**: Add provider-neutral dashboard read-model fields for compact project source signals.

- [x] T005 Add compact project source signal types/fields to `src/features/city-view/scene/office/dashboard/CompanyDashboardTypes.ts`.
- [x] T006 Ensure `createEmptyCompanyDashboardSnapshot` initializes source signal fields safely in `src/features/city-view/scene/office/dashboard/CompanyDashboardTypes.ts`.
- [x] T007 Add or update type tests for empty/default source signal behavior in `src/features/city-view/scene/office/dashboard/CompanyDashboardTypes.test.ts`.

---

## Phase 3: User Story 1 - See Project Source Signals (Priority: P1)

**Goal**: Derive source signals per project from existing internal project data and existing read-only GitHub mapping/status inputs.

**Independent Test**: Provider tests can show internal-only, GitHub-linked fresh, stale, unavailable, and unknown project source signals without network calls.

- [x] T008 [US1] Extend `InternalSimulationDashboardProviderContext` with read-only repository mapping and repository summary inputs in `src/features/city-view/scene/office/dashboard/InternalSimulationDashboardProvider.ts`.
- [x] T009 [US1] Derive Internal project source signals for projects without external mappings in `src/features/city-view/scene/office/dashboard/InternalSimulationDashboardProvider.ts`.
- [x] T010 [US1] Derive GitHub linked project source signals from existing mapping validation and source-status helpers in `src/features/city-view/scene/office/dashboard/InternalSimulationDashboardProvider.ts`.
- [x] T011 [US1] Add provider tests for internal-only, valid GitHub linked, missing summary, stale, unavailable, private/unauthenticated, rate-limited, offline, and unknown source states in `src/features/city-view/scene/office/dashboard/InternalSimulationDashboardProvider.test.ts`.

---

## Phase 4: User Story 2 - Preserve Read-Only Observation (Priority: P1)

**Goal**: Prove source signal derivation does not mutate simulation state, repository mapping state, or repository summary state.

**Independent Test**: Snapshot all provider inputs before and after source signal derivation and verify equality.

- [x] T012 [US2] Add read-only regression tests for project, task, employee, schedule, work-session, progression, company influence, repository mapping, and repository summary inputs in `src/features/city-view/scene/office/dashboard/InternalSimulationDashboardProvider.test.ts`.
- [x] T013 [US2] Add assertions that dashboard source signal output does not expose refresh, sync, credential, issue, pull request, branch, commit, merge, or repository mutation affordances in `src/features/city-view/scene/office/dashboard/CompanyDashboardView.test.ts`.

---

## Phase 5: User Story 3 - Keep Provider-Neutral Dashboard Boundaries (Priority: P2)

**Goal**: Render project source signal text through Company Dashboard read-model data without coupling the view to GitHub provider implementation.

**Independent Test**: View tests render compact source signal rows from provider-neutral snapshot data and confirm GitHub provider implementation imports are absent.

- [x] T014 [US3] Add compact project source signal rows to `src/features/city-view/scene/office/dashboard/CompanyDashboardView.ts`.
- [x] T015 [US3] Add view tests for internal-only, GitHub linked, stale/unavailable, and empty project source signal rendering in `src/features/city-view/scene/office/dashboard/CompanyDashboardView.test.ts`.
- [x] T016 [US3] Confirm `src/features/city-view/scene/office/dashboard/CompanyDashboardView.ts` does not import GitHub provider implementation or GitHub API response types.

---

## Phase 6: Integration and Validation

**Purpose**: Keep the feature small, safe, and ready for Claude review.

- [x] T017 Review whether `src/features/city-view/scene/office/OfficeProjectPortalController.ts` already passes repository mapping/summary inputs to the Company Dashboard provider; add the smallest read-only pass-through only if required.
- [x] T018 Run `npm test`.
- [x] T019 Run `npx tsc --noEmit`.
- [x] T020 Run `npm run build`.
- [x] T021 Run `git diff --check`.
- [x] T022 Run `git diff --cached --check`.
- [x] T023 Confirm no GitHub API calls, credentials, repository refresh/sync, repository mutation, management controls, task mutation, or employee-control behavior was added.

## Dependencies

- Phase 1 must complete before implementation.
- Phase 2 blocks source derivation and view rendering.
- Phase 3 and Phase 4 may be developed together after Phase 2 but must both pass before final validation.
- Phase 5 depends on the read model from Phase 2 and source derivation from Phase 3.
- Phase 6 completes validation and review readiness.

## Parallel Example

After T005 establishes the source signal shape, T011 provider tests and T015 view tests can be prepared in parallel if they touch different test files. T012 read-only regression coverage can be added independently of the visual row formatting.

## Implementation Strategy

1. Inspect existing dashboard, GitHub, and Project Dashboard source metadata patterns.
2. Add the smallest provider-neutral source signal shape to the Company Dashboard project summary.
3. Derive source signals from existing local mapping/status data only.
4. Render compact deterministic source signal rows.
5. Add focused provider/view/read-only tests.
6. Run the full validation suite.
