# Tasks: Operator Task Planning Project Backlog Foundation

**Input**: Design artifacts from `specs/141-operator-task-planning-project-backlog-foundation/`
**Prerequisites**: `spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/project-backlog-ui.md`

## Phase 1: Setup

- [X] T001 Verify Spec 141 documentation artifacts exist in `specs/141-operator-task-planning-project-backlog-foundation/`
- [X] T002 Update Spec Kit agent plan pointer in `AGENTS.md`

## Phase 2: Foundational

- [X] T003 Add project backlog types in `src/features/city-view/scene/office/project-backlog/ProjectBacklogTypes.ts`
- [X] T004 Add canonical scoped backlog creation/edit/order/summary service in `src/features/city-view/scene/office/project-backlog/ProjectBacklogService.ts`
- [X] T005 Add deterministic backlog service tests in `src/features/city-view/scene/office/project-backlog/ProjectBacklogService.test.ts`
- [X] T006 Add backlog collections to portal state and browser session persistence in `src/features/city-view/scene/office/OfficeProjectPortalTypes.ts`, `src/features/city-view/scene/office/OfficeProjectPortalRegistry.ts`, `src/features/city-view/scene/office/browser-session/BrowserOfficeSessionTypes.ts`, and `src/features/city-view/scene/office/browser-session/BrowserOfficeSessionService.ts`

## Phase 3: User Story 1 - Create Project Backlog Tasks (Priority: P1)

- [X] T007 [US1] Add office backlog runtime title/description inputs in `src/features/city-view/scene/office/CompanyOfficeScene.ts`
- [X] T008 [US1] Add planning view mode and creation input handling in `src/features/city-view/scene/office/OfficeProjectPortalController.ts`
- [X] T009 [US1] Render project-scoped backlog list and create controls in `src/features/city-view/scene/office/OfficeProjectPortalView.ts`
- [X] T010 [US1] Add controller tests for Project A/Project B task creation and switching in `src/features/city-view/scene/office/OfficeProjectPortalController.project-backlog.test.ts`

## Phase 4: User Story 2 - Edit Planning State Safely (Priority: P2)

- [X] T011 [US2] Add selected task edit handling for title, description, priority, status, and blocked reason in `src/features/city-view/scene/office/OfficeProjectPortalController.ts`
- [X] T012 [US2] Render backlog task detail edit state and unavailable mutation messaging in `src/features/city-view/scene/office/OfficeProjectPortalView.ts`
- [X] T013 [US2] Add stale task/project rejection, missing project, Ready-no-ADOS, and blocked-distinction tests in `src/features/city-view/scene/office/OfficeProjectPortalController.project-backlog.test.ts`

## Phase 5: User Story 3 - Review Deterministic Backlog Order (Priority: P3)

- [X] T014 [US3] Use deterministic service ordering in office backlog rendering in `src/features/city-view/scene/office/OfficeProjectPortalController.ts`
- [X] T015 [US3] Add priority/status transition persistence tests in `src/features/city-view/scene/office/project-backlog/ProjectBacklogService.test.ts`

## Phase 6: User Story 4 - See Portfolio Backlog Indicators (Priority: P4)

- [X] T016 [US4] Add project-scoped backlog summary fields to `src/features/city-view/scene/PortfolioOperationsService.ts`
- [X] T017 [US4] Render compact backlog summary on project dashboard/city status surfaces in `src/features/city-view/scene/office/OfficeProjectPortalView.ts`
- [X] T018 [US4] Add portfolio backlog summary read-only tests in `src/features/city-view/scene/PortfolioOperationsService.test.ts`

## Phase 7: Polish & Cross-Cutting

- [X] T019 Document runtime evidence in `specs/141-operator-task-planning-project-backlog-foundation/runtime-verification.md`
- [X] T020 Run targeted tests from quickstart and `git diff --check`

## Dependencies

- Phase 1 before Phase 2.
- Phase 2 before all user story phases.
- US1 before US2 task editing.
- US3 depends on the foundational ordering service.
- US4 depends on project-scoped backlog summaries.

## Implementation Strategy

Implement the project-scoped backlog model/service and persistence first, then add office creation/edit UI, deterministic ordering, portfolio read-only indicators, runtime evidence notes, and targeted tests. Keep Ready and Blocked as planning-only states and never invoke ADOS or development request creation from backlog actions.
