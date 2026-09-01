# Tasks: Ready Task to Development Request Execution Bridge

**Input**: Design documents from `specs/142-ready-task-to-development-request-execution/`

**Prerequisites**: `spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/backlog-development-bridge.md`

**Tests**: Required by Spec 142 for deterministic eligibility, mapping, durable requirements, safety, association, duplicate, reload, isolation, blocked/complete, and compatibility coverage.

## Phase 1: Setup

- [X] T001 Verify Spec 142 documentation artifacts exist in `specs/142-ready-task-to-development-request-execution/`
- [X] T002 Update `.specify/feature.json` to point at `specs/142-ready-task-to-development-request-execution`

## Phase 2: Foundational

- [X] T003 Extend backlog task association fields in `src/features/city-view/scene/office/project-backlog/ProjectBacklogTypes.ts`
- [X] T004 Add association update/cloning support in `src/features/city-view/scene/office/project-backlog/ProjectBacklogService.ts`
- [X] T005 Add focused bridge service in `src/features/city-view/scene/office/project-backlog/ProjectBacklogDevelopmentBridgeService.ts`
- [X] T006 Add bridge service tests in `src/features/city-view/scene/office/project-backlog/ProjectBacklogDevelopmentBridgeService.test.ts`

## Phase 3: User Story 1 - Select Ready Task Preview (Priority: P1)

**Goal**: Selecting a Ready task shows the exact project/task target without execution or mutation.

**Independent Test**: Select a Ready task and verify no request, preparation, execution, or in-progress planning state is created.

- [X] T007 [US1] Add controller preview/probe state for selected task execution eligibility in `src/features/city-view/scene/office/OfficeProjectPortalController.ts`
- [X] T008 [US1] Render task execution preview and disabled Start Development states in `src/features/city-view/scene/office/OfficeProjectPortalView.ts`
- [X] T009 [US1] Add preview-only controller coverage in `src/features/city-view/scene/office/OfficeProjectPortalController.project-backlog-development.test.ts`

## Phase 4: User Story 2 - Start Task Development Explicitly (Priority: P1)

**Goal**: Start Development maps a Ready task to the existing Spec 138 request, durable requirements, preparation, and trusted ADOS execution path.

**Independent Test**: Start a Ready task with shell-like multiline text and verify request/artifact/ADOS invocation/association are project-scoped and preserve full content safely.

- [X] T010 [US2] Add source backlog task id support to development request draft types and artifact content in `src/features/city-view/scene/office/external-development-requests/ExternalProjectDevelopmentRequestTypes.ts` and `src/features/city-view/scene/office/external-development-requests/ExternalProjectDevelopmentRequestService.ts`
- [X] T011 [US2] Wire explicit Start Development from backlog to existing draft/preparation/execution services in `src/features/city-view/scene/office/OfficeProjectPortalController.ts`
- [X] T012 [US2] Add explicit start mapping and shell-safety controller coverage in `src/features/city-view/scene/office/OfficeProjectPortalController.project-backlog-development.test.ts`

## Phase 5: User Story 3 - Reconnect Existing Task Execution (Priority: P2)

**Goal**: Duplicate clicks and reloads reconnect the exact task association without launching another run or guessing latest state.

**Independent Test**: Persist an accepted association, restore session, click Start again, and verify no duplicate request/run.

- [X] T013 [US3] Persist task association metadata through existing session cloning in `src/features/city-view/scene/office/browser-session/BrowserOfficeSessionService.ts`
- [X] T014 [US3] Add duplicate-click and reload reconnect coverage in `src/features/city-view/scene/office/OfficeProjectPortalController.project-backlog-development.test.ts`
- [X] T015 [US3] Add Project A/Project B isolation and no-latest-run coverage in `src/features/city-view/scene/office/OfficeProjectPortalController.project-backlog-development.test.ts`

## Phase 6: User Story 4 - Truthful Execution State Awareness (Priority: P3)

**Goal**: Planning states remain distinct from real ADOS execution states in office and concise portfolio summaries.

**Independent Test**: Seed associated blocked/complete execution states and verify display state is truthful and project-scoped.

- [X] T016 [US4] Expose execution state separate from planning state in backlog preview rendering in `src/features/city-view/scene/office/OfficeProjectPortalView.ts`
- [X] T017 [US4] Extend portfolio backlog awareness for in-development/blocked/completed indicators in `src/features/city-view/scene/PortfolioOperationsService.ts`
- [X] T018 [US4] Add blocked/complete distinction coverage in `src/features/city-view/scene/office/OfficeProjectPortalController.project-backlog-development.test.ts` and `src/features/city-view/scene/PortfolioOperationsService.test.ts`

## Phase 7: Polish & Cross-Cutting

- [X] T019 Document runtime bridge evidence expectations in `specs/142-ready-task-to-development-request-execution/runtime-verification.md`
- [X] T020 Run focused bridge validation and diff checks allowed in this runtime, leaving full ADOS validation to ADOS per handoff policy

## Dependencies & Execution Order

- Phase 1 precedes all implementation.
- Phase 2 blocks all user stories.
- US1 and US2 are P1 and should be completed before reconnect and awareness refinements.
- US3 depends on persisted associations from US2.
- US4 depends on associated execution state from US2/US3.

## Parallel Opportunities

- T006 can be developed alongside controller test planning after T005 exists.
- T014 and T015 share the same controller test file and should be sequenced in practice despite covering different cases.
- Portfolio awareness tests can run independently after bridge association fields exist.

## Implementation Strategy

Implement the bridge service first, then wire explicit controller actions, render preview/confirmation state, and add deterministic tests. Keep every lookup project-scoped and every start human-triggered. Do not run the full ADOS validation pipeline from this runtime.
