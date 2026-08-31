# Tasks: Multi-Project Company Operations

**Input**: Design documents from `/specs/139-multi-project-company-operations/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Required by the authoritative handoff.

## Phase 1: Setup

- [X] T001 Create Spec 139 documentation artifacts in specs/139-multi-project-company-operations/
- [X] T002 Update AGENTS.md Spec Kit pointer to specs/139-multi-project-company-operations/plan.md

---

## Phase 2: Foundational

- [X] T003 [P] [US1] Add city project operations status types/service in src/features/city-view/scene/CityProjectOperationsStatusService.ts
- [X] T004 [P] [US1] Add deterministic status isolation tests in src/features/city-view/scene/CityProjectOperationsStatusService.test.ts

---

## Phase 3: User Story 1 - See Independent Company Operations (Priority: P1)

**Goal**: City buildings expose distinct project-scoped operational states.

**Independent Test**: Project A implementation and Project B review appear independently in the city status projection.

- [X] T005 [US1] Render building-attached status badges in src/features/city-view/scene/layers/CityBuildingLayer.ts
- [X] T006 [US1] Add city building layer status rendering tests in src/features/city-view/scene/layers/CityBuildingLayer.test.ts

---

## Phase 4: User Story 2 - Preserve State While Switching Companies (Priority: P2)

**Goal**: City runtime state and office entry share the same canonical project association.

**Independent Test**: Runtime world-state buildings include project ids and independent stages for multiple companies.

- [X] T007 [US2] Add project operation status fields to src/features/city-view/scene/world-state/WorldStateTypes.ts
- [X] T008 [US2] Feed city operation statuses into src/features/city-view/scene/world-state/WorldStateSynchronizer.ts and src/features/city-view/scene/CityWorldScene.ts
- [X] T009 [US2] Add world-state project status tests in src/features/city-view/scene/world-state/WorldStateSynchronizer.test.ts

---

## Phase 5: User Story 3 - Fail Closed for Blocked, Complete, and Disconnected Projects (Priority: P3)

**Goal**: Blocked, complete, idle, and disconnected statuses remain scoped to the correct project.

**Independent Test**: Removed project bindings are disconnected, blocked state marks only the matching company, complete state clears active treatment only for the completed project, and no-run projects remain idle.

- [X] T010 [US3] Cover blocked/complete/idle/disconnected edge cases in src/features/city-view/scene/CityProjectOperationsStatusService.test.ts

---

## Phase 6: Polish

- [X] T011 Run targeted Vitest coverage for modified modules
- [X] T012 Run git diff --check and git diff --cached --check
- [X] T013 Document runtime verification evidence or limits in specs/139-multi-project-company-operations/runtime-verification.md

## Dependencies & Execution Order

- Phase 1 precedes application changes.
- Phase 2 creates the city status source of truth for all stories.
- US1 is the MVP and should complete before runtime-state exposure.
- US2 and US3 depend on the status projection and can be validated with focused tests.

## Parallel Opportunities

- T003 and T004 affect different files and can be reviewed independently.
- T006 and T009 target separate tests after rendering/world-state integration.

## Implementation Strategy

First create the project-scoped city status projection, then render it on buildings, then attach it to world-state synchronization. Keep every lookup keyed by canonical project id and never infer from global latest run data.
