# Tasks: Trusted Local ADOS Execution Bridge

**Input**: Design documents from `/specs/129-trusted-local-ados-execution-bridge/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Focused Vitest tests are included because the bridge controls local process execution gating.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Align active Spec Kit metadata and approved preparation defaults.

- [X] T001 Update `.specify/feature.json` to point at `specs/129-trusted-local-ados-execution-bridge`
- [X] T002 Update `AGENTS.md` Spec Kit pointer to `specs/129-trusted-local-ados-execution-bridge/plan.md`
- [X] T003 Update Spec 129 ADOS preparation defaults in `src/features/city-view/scene/office/external-ados-run-preparation/ExternalProjectAdosRunPreparationService.ts`
- [X] T004 Update preparation default expectations in `src/features/city-view/scene/office/external-ados-run-preparation/ExternalProjectAdosRunPreparationService.test.ts` and `src/features/city-view/scene/office/OfficeProjectPortalController.project-dashboard.test.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add bridge state, persistence, and test helper access before dashboard orchestration.

- [X] T005 [P] Create bridge types in `src/features/city-view/scene/office/external-ados-execution/ExternalProjectAdosExecutionTypes.ts`
- [X] T006 [P] Create bridge service tests in `src/features/city-view/scene/office/external-ados-execution/ExternalProjectAdosExecutionService.test.ts`
- [X] T007 [P] Create bridge view tests in `src/features/city-view/scene/office/external-ados-execution/ExternalProjectAdosExecutionView.test.ts`
- [X] T008 Add bridge state to `src/features/city-view/scene/office/OfficeProjectPortalTypes.ts` and `src/features/city-view/scene/office/OfficeProjectPortalRegistry.ts`
- [X] T009 Add bridge persistence to `src/features/city-view/scene/office/browser-session/BrowserOfficeSessionTypes.ts`, `src/features/city-view/scene/office/browser-session/BrowserOfficeSessionService.ts`, and `src/features/city-view/scene/office/browser-session/BrowserOfficeSessionService.test.ts`

---

## Phase 3: User Story 1 - Start Trusted Local Implementer (Priority: P1) MVP

**Goal**: Start the approved local implementer provider from a trusted external ADOS preparation.

**Independent Test**: Drive external project draft -> preparation -> bridge action with a stub provider and verify an execution result exists with no downstream side effects.

- [X] T010 [US1] Implement bridge service provider invocation in `src/features/city-view/scene/office/external-ados-execution/ExternalProjectAdosExecutionService.ts`
- [X] T011 [US1] Wire controller bridge service construction in `src/features/city-view/scene/office/OfficeProjectPortalController.ts`
- [X] T012 [US1] Wire Project Dashboard action sequence to start the bridge after preparation in `src/features/city-view/scene/office/OfficeProjectPortalController.ts`
- [X] T013 [US1] Add controller tests for trusted bridge start in `src/features/city-view/scene/office/OfficeProjectPortalController.project-dashboard.test.ts`

---

## Phase 4: User Story 2 - Block Untrusted or Stale Starts (Priority: P2)

**Goal**: Record blocked results without provider invocation for unsafe bridge contexts.

**Independent Test**: Attempt bridge start with stale preparation metadata or missing local worktree and verify blocked reason codes and no provider call.

- [X] T014 [US2] Implement stale metadata and local binding guards in `src/features/city-view/scene/office/external-ados-execution/ExternalProjectAdosExecutionService.ts`
- [X] T015 [US2] Add blocked controller/service coverage in `src/features/city-view/scene/office/external-ados-execution/ExternalProjectAdosExecutionService.test.ts` and `src/features/city-view/scene/office/OfficeProjectPortalController.project-dashboard.test.ts`

---

## Phase 5: User Story 3 - Inspect Bridge Status (Priority: P3)

**Goal**: Render bridge state on the external Project Dashboard.

**Independent Test**: Render dashboard with bridge result and confirm the `[ADOS EXEC]` row includes status, worktree, branch, and no-side-effect text.

- [X] T016 [US3] Implement bridge display rows in `src/features/city-view/scene/office/external-ados-execution/ExternalProjectAdosExecutionView.ts`
- [X] T017 [US3] Wire dashboard bridge rendering in `src/features/city-view/scene/office/OfficeProjectPortalView.ts`
- [X] T018 [US3] Add dashboard rendering coverage in `src/features/city-view/scene/office/OfficeProjectPortalView.test.ts`

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Ensure tasks and boundaries are complete.

- [X] T019 Mark completed tasks in `specs/129-trusted-local-ados-execution-bridge/tasks.md`
- [X] T020 Inspect git diff for unintended primary repository or out-of-scope mutations

## Dependencies & Execution Order

- Phase 1 precedes all code changes.
- Phase 2 adds shared data and persistence surfaces.
- User Story 1 depends on Phase 2.
- User Story 2 depends on the bridge service from User Story 1.
- User Story 3 depends on bridge state from Phase 2.

## Parallel Opportunities

- T005, T006, and T007 touch separate files and can be done in parallel.
- View tests and service tests can be written independently once types exist.

## Implementation Strategy

Complete setup and foundational state first, deliver User Story 1 as the MVP, then add blocked-context coverage and dashboard status rendering.
