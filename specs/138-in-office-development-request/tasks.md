# Tasks: In-Office Development Request

**Input**: Design documents from `/specs/138-in-office-development-request/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Required by the authoritative handoff.

## Phase 1: Setup

- [X] T001 Create Spec 138 documentation artifacts in specs/138-in-office-development-request/
- [X] T002 Update AGENTS.md Spec Kit pointer to specs/138-in-office-development-request/plan.md

---

## Phase 2: Foundational

- [X] T003 [P] Extend durable development request types in src/features/city-view/scene/office/external-development-requests/ExternalProjectDevelopmentRequestTypes.ts
- [X] T004 [P] Extend ADOS preparation/execution types in src/features/city-view/scene/office/external-ados-run-preparation/ExternalProjectAdosRunPreparationTypes.ts and src/features/city-view/scene/office/external-ados-execution/ExternalProjectAdosExecutionTypes.ts
- [X] T005 Add project-scoped request target resolution and durable requirements helpers in src/features/city-view/scene/office/external-development-requests/ExternalProjectDevelopmentRequestService.ts
- [X] T006 Add deterministic ADOS feature identity and requirements-file preparation in src/features/city-view/scene/office/external-ados-run-preparation/ExternalProjectAdosRunPreparationService.ts

---

## Phase 3: User Story 1 - Submit Bound Project Request (Priority: P1)

**Goal**: Submit a real ADOS request for the active bound project.

**Independent Test**: Active Company A request targets Project A even after stale selection points at Project B.

- [X] T007 [P] [US1] Add request targeting tests in src/features/city-view/scene/office/external-development-requests/ExternalProjectDevelopmentRequestService.test.ts
- [X] T008 [P] [US1] Add preparation requirements preservation tests in src/features/city-view/scene/office/external-ados-run-preparation/ExternalProjectAdosRunPreparationService.test.ts
- [X] T009 [US1] Scope create/prepare/start actions to active project-company context in src/features/city-view/scene/office/OfficeProjectPortalController.ts
- [X] T010 [US1] Show target identity, local path, and requirements/run context in src/features/city-view/scene/office/external-development-requests/ExternalProjectDevelopmentRequestView.ts and src/features/city-view/scene/office/external-ados-run-preparation/ExternalProjectAdosRunPreparationView.ts
- [X] T011 [US1] Preserve full request requirements in trusted execution prompt/metadata without shell interpolation in src/features/city-view/scene/office/external-ados-execution/ExternalProjectAdosExecutionService.ts

---

## Phase 4: User Story 2 - Persist and Reconnect Real Run State (Priority: P2)

**Goal**: Re-entry reconnects to request/run state and visualizes the real stage.

**Independent Test**: Restore browser session and derive Project Status/live visualization from persisted request/run records.

- [X] T012 [P] [US2] Add persistence/status tests in src/features/city-view/scene/office/browser-session/BrowserOfficeSessionService.test.ts and src/features/city-view/scene/office/LiveAgentWorkVisualization.test.ts
- [X] T013 [US2] Surface request title/spec/run id/status details in src/features/city-view/scene/office/LiveAgentWorkVisualization.ts
- [X] T014 [US2] Ensure derived ADOS status uses project-scoped persisted execution/request records in src/features/city-view/scene/office/external-ados-run-status/ExternalProjectAdosRunStatusService.ts

---

## Phase 5: User Story 3 - Prevent Unsafe or Duplicate Execution (Priority: P3)

**Goal**: Duplicate, conflict, unavailable runtime, and hostile input cases fail safely.

**Independent Test**: Duplicate submit creates no second run; missing runtime blocks; raw text never becomes command syntax.

- [X] T015 [P] [US3] Add execution safety and duplicate tests in src/features/city-view/scene/office/external-ados-execution/ExternalProjectAdosExecutionService.test.ts
- [X] T016 [P] [US3] Add employee scoping tests in src/features/city-view/scene/office/LiveAgentWorkVisualization.test.ts
- [X] T017 [US3] Add duplicate submit guard and active conflict handling in src/features/city-view/scene/office/OfficeProjectPortalController.ts and src/features/city-view/scene/office/external-ados-execution/ExternalProjectAdosExecutionService.ts
- [X] T018 [US3] Tighten employee selection to prefer same-project workers and deterministic shared workers in src/features/city-view/scene/office/LiveAgentWorkVisualization.ts

---

## Phase 6: Polish

- [X] T019 Run targeted tests for modified modules
- [X] T020 Run git diff --check and git diff --cached --check
- [X] T021 Document runtime verification limits in specs/138-in-office-development-request/runtime-verification.md

## Dependencies & Execution Order

- Phase 1 precedes application changes.
- Phase 2 blocks all user stories.
- US1 is the MVP and should complete before status/re-entry polishing.
- US2 and US3 can proceed after the foundation but share controller/status files, so edits should be serialized.

## Parallel Opportunities

- T003 and T004 can be implemented in parallel.
- T007, T008, T012, T015, and T016 are test-only tasks in different files.

## Implementation Strategy

Implement the existing request/preparation/execution pipeline in place, then update controller target resolution, status visualization, duplicate safeguards, and focused tests. Avoid redesigning the office or creating a second UI.
