# Tasks: Controlled Autonomous Backlog Execution Policy

**Input**: Design documents from `/specs/144-controlled-autonomous-backlog-execution-policy/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Required by the authoritative requirements.

## Phase 1: Setup

- [X] T001 Create Spec 144 documentation artifacts in `specs/144-controlled-autonomous-backlog-execution-policy/`
- [X] T002 Update `.specify/feature.json` to point at `specs/144-controlled-autonomous-backlog-execution-policy`
- [X] T003 Update `AGENTS.md` SPECKIT pointer to Spec 144 plan

---

## Phase 2: Foundational

- [X] T004 [P] Add project autonomy policy types in `src/features/city-view/scene/office/project-backlog/ProjectAutonomousExecutionPolicyTypes.ts`
- [X] T005 Add deterministic fail-closed policy service in `src/features/city-view/scene/office/project-backlog/ProjectAutonomousExecutionPolicyService.ts`
- [X] T006 Add policy service tests for default off, project isolation, priority filtering, deterministic selection, active-run blocking, malformed/disconnected fail-closed, no suggestion/task creation, and no-eligible stop behavior in `src/features/city-view/scene/office/project-backlog/ProjectAutonomousExecutionPolicyService.test.ts`
- [X] T007 Add project autonomy policy state to `src/features/city-view/scene/office/OfficeProjectPortalTypes.ts` and initial state in `src/features/city-view/scene/office/OfficeProjectPortalRegistry.ts`
- [X] T008 Persist and validate project autonomy policies in `src/features/city-view/scene/office/browser-session/BrowserOfficeSessionTypes.ts` and `src/features/city-view/scene/office/browser-session/BrowserOfficeSessionService.ts`
- [X] T009 Extend browser session tests for project-specific policy persistence and malformed policy fail-closed behavior in `src/features/city-view/scene/office/browser-session/BrowserOfficeSessionService.test.ts`

---

## Phase 3: User Story 1 - Explicit Project Autonomy Control (Priority: P1)

**Goal**: Operators can deliberately enable, configure, disable, and observe project-scoped autonomy without enabling other projects.

**Independent Test**: Enable Project A policy, reload, switch to Project B, and verify Project B remains off.

- [X] T010 [US1] Add controller policy update and probe methods in `src/features/city-view/scene/office/OfficeProjectPortalController.ts`
- [X] T011 [US1] Add compact autonomy state display to `src/features/city-view/scene/office/OfficeProjectPortalView.ts`
- [X] T012 [US1] Add controller tests for default off, enable/disable persistence, multi-project isolation, and disable-during-active-run behavior in `src/features/city-view/scene/office/OfficeProjectPortalController.project-autonomy.test.ts`

---

## Phase 4: User Story 2 - Safe Deterministic Automatic Start (Priority: P2)

**Goal**: Automatic evaluation starts one eligible Ready task through Spec 142 and remains idempotent.

**Independent Test**: Run repeated evaluation for a project with multiple Ready tasks and verify deterministic one-time bridge execution and truthful task state.

- [X] T013 [US2] Add controller autonomous reevaluation orchestration that selects a task then calls existing `startSelectedBacklogTaskDevelopment` in `src/features/city-view/scene/office/OfficeProjectPortalController.ts`
- [X] T014 [US2] Add tests that automatic start reuses Spec 142 bridge, creates no duplicate request/preparation/execution, marks In Progress only after acceptance, failed pre-start leaves Ready, and reload does not relaunch associated execution in `src/features/city-view/scene/office/OfficeProjectPortalController.project-autonomy.test.ts`
- [X] T015 [US2] Preserve existing manual Start Development tests and bridge behavior in `src/features/city-view/scene/office/OfficeProjectPortalController.project-backlog-development.test.ts`

---

## Phase 5: User Story 3 - Fail-Closed Waiting and Isolation (Priority: P3)

**Goal**: Waiting/blocking reasons are deterministic, active or blocked runs prevent bypass, suggestions are not accepted, and portfolio state is read-only.

**Independent Test**: Simulate off, priority-filtered, no-ready, active-run, blocked-run, disconnected, and suggestion-only states and verify no automatic start except the eligible enabled project.

- [X] T016 [US3] Surface concise autonomy waiting/running reason in controller probe and office view in `src/features/city-view/scene/office/OfficeProjectPortalController.ts` and `src/features/city-view/scene/office/OfficeProjectPortalView.ts`
- [X] T017 [US3] Add read-only portfolio autonomy summary in `src/features/city-view/scene/PortfolioOperationsService.ts`
- [X] T018 [US3] Add portfolio autonomy summary read-only tests in `src/features/city-view/scene/PortfolioOperationsService.test.ts`
- [X] T019 [US3] Add tests that policy edits do not mutate active run, Spec 143 suggestions are not auto-accepted, no backlog task is auto-created, no eligible Ready tasks stop evaluation, blocked associated runs prevent bypass, and unavailable projects fail closed in `src/features/city-view/scene/office/OfficeProjectPortalController.project-autonomy.test.ts`

---

## Final Phase: Polish

- [X] T020 Add runtime evidence for the two-project controlled autonomy scenario in `specs/144-controlled-autonomous-backlog-execution-policy/runtime-evidence.json`
- [X] T021 Run targeted validation only: `npx vitest run src/features/city-view/scene/office/project-backlog/ProjectAutonomousExecutionPolicyService.test.ts src/features/city-view/scene/office/OfficeProjectPortalController.project-autonomy.test.ts src/features/city-view/scene/office/browser-session/BrowserOfficeSessionService.test.ts src/features/city-view/scene/PortfolioOperationsService.test.ts`
- [X] T022 Run lightweight diff whitespace checks: `git diff --check` and `git diff --cached --check`

## Dependencies & Execution Order

- Phase 1 must complete before implementation.
- Phase 2 blocks all user stories.
- US1 should complete before US2 because controller policy state drives evaluation.
- US2 should complete before US3 because waiting summaries depend on evaluation outcomes.
- Polish depends on all stories.

## Parallel Opportunities

- T004 can run independently before T005.
- Service tests and session tests can be developed in parallel after types exist.
- Portfolio summary work can be isolated after controller evaluation result shape is stable.

## Implementation Strategy

Implement the policy service and persistence first, then wire compact office controls, then add one-shot autonomous evaluation through the existing bridge, then derive read-only portfolio summaries and runtime evidence.
