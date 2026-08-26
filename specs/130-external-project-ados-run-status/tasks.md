# Tasks: External Project ADOS Run Status

**Input**: Design documents from `/specs/130-external-project-ados-run-status/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Focused Vitest tests are included because the status row is an operator-facing execution audit surface.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Align active Spec Kit metadata for Spec 130.

- [X] T001 Update `.specify/feature.json` to point at `specs/130-external-project-ados-run-status`
- [X] T002 Update `AGENTS.md` Spec Kit pointer to `specs/130-external-project-ados-run-status/plan.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add status state, persistence, and focused tests before dashboard rendering.

- [X] T003 [P] Create status types in `src/features/city-view/scene/office/external-ados-run-status/ExternalProjectAdosRunStatusTypes.ts`
- [X] T004 [P] Create status service tests in `src/features/city-view/scene/office/external-ados-run-status/ExternalProjectAdosRunStatusService.test.ts`
- [X] T005 [P] Create status view tests in `src/features/city-view/scene/office/external-ados-run-status/ExternalProjectAdosRunStatusView.test.ts`
- [X] T006 Add status state to `src/features/city-view/scene/office/OfficeProjectPortalTypes.ts` and `src/features/city-view/scene/office/OfficeProjectPortalRegistry.ts`
- [X] T007 Add status persistence to `src/features/city-view/scene/office/browser-session/BrowserOfficeSessionTypes.ts`, `src/features/city-view/scene/office/browser-session/BrowserOfficeSessionService.ts`, and `src/features/city-view/scene/office/browser-session/BrowserOfficeSessionService.test.ts`

---

## Phase 3: User Story 1 - See Current ADOS Run Status (Priority: P1) MVP

**Goal**: Show one current ADOS status row for prepared or attempted runs.

**Independent Test**: Drive prepared and execution-result states through the status service/view and verify the current dashboard row.

- [X] T008 [US1] Implement status derivation in `src/features/city-view/scene/office/external-ados-run-status/ExternalProjectAdosRunStatusService.ts`
- [X] T009 [US1] Implement status display rows in `src/features/city-view/scene/office/external-ados-run-status/ExternalProjectAdosRunStatusView.ts`
- [X] T010 [US1] Wire dashboard status rendering in `src/features/city-view/scene/office/OfficeProjectPortalView.ts`
- [X] T011 [US1] Add dashboard rendering coverage in `src/features/city-view/scene/office/OfficeProjectPortalView.test.ts`

---

## Phase 4: User Story 2 - Preserve Status Across Session Restore (Priority: P2)

**Goal**: Persist status summaries through browser office session save/restore.

**Independent Test**: Save and restore session state with ADOS status and verify it remains available.

- [X] T012 [US2] Add browser session persistence coverage in `src/features/city-view/scene/office/browser-session/BrowserOfficeSessionService.test.ts`

---

## Phase 5: User Story 3 - Keep Status Read-Only and Side-Effect Safe (Priority: P3)

**Goal**: Ensure status inspection never implies or triggers downstream work.

**Independent Test**: Render blocked, failed, timed-out, cancelled, started, and completed status inputs and verify no downstream side effects are shown as started.

- [X] T013 [US3] Add side-effect boundary status coverage in `src/features/city-view/scene/office/external-ados-run-status/ExternalProjectAdosRunStatusService.test.ts` and `src/features/city-view/scene/office/external-ados-run-status/ExternalProjectAdosRunStatusView.test.ts`

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Ensure tasks and boundaries are complete.

- [X] T014 Mark completed tasks in `specs/130-external-project-ados-run-status/tasks.md`
- [X] T015 Inspect git diff for unintended primary repository or out-of-scope mutations

## Dependencies & Execution Order

- Phase 1 precedes all code changes.
- Phase 2 adds shared data and persistence surfaces.
- User Story 1 depends on Phase 2.
- User Story 2 depends on Phase 2.
- User Story 3 depends on User Story 1 status derivation and rendering.

## Parallel Opportunities

- T003, T004, and T005 touch separate files and can be done in parallel.
- Status service and status view tests can be expanded independently once types exist.

## Implementation Strategy

Complete setup and status state first, deliver prepared/result status rendering as the MVP, then add persistence and side-effect boundary coverage.
