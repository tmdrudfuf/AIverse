# Tasks: NPC Movement Foundation

## Phase 1: Setup
- [x] T001 Confirm Phase 26 NPC renderer and view model files exist in `src/features/city-view/scene/office/npc/` before implementation.
- [x] T002 Confirm Phase 25 employee simulation snapshots exist in `src/features/city-view/scene/office/employees/EmployeeSimulationTypes.ts` before implementation.

## Phase 2: Movement Domain Foundation
- [x] T003 [P] Add `EmployeeNpcMovementTypes.ts` with logical positions, movement states, movement snapshot, and position hint types in `src/features/city-view/scene/office/npc/EmployeeNpcMovementTypes.ts`.
- [x] T004 Add `EmployeeNpcMovementService.ts` in `src/features/city-view/scene/office/npc/EmployeeNpcMovementService.ts` without Phaser imports.
- [x] T005 Implement deterministic target-position derivation from employee simulation snapshots in `EmployeeNpcMovementService.ts`.
- [x] T006 Implement read-only movement snapshot exposure in `EmployeeNpcMovementService.ts`.

## Phase 3: Controller View Model Integration
- [x] T007 Add controller-owned movement service wiring in `src/features/city-view/scene/office/OfficeProjectPortalController.ts`.
- [x] T008 Add `getEmployeeMovementSnapshots()` or equivalent read-only controller method in `OfficeProjectPortalController.ts`.
- [x] T009 Add `getEmployeeNpcViewModelsWithMovement()` or extend existing NPC view-model derivation in `OfficeProjectPortalController.ts` while preserving EmployeeSimulationService as the work-state source.
- [x] T010 Ensure controller movement derivation has no Phaser imports and does not call providers or external APIs in `OfficeProjectPortalController.ts`.

## Phase 4: Renderer Integration
- [x] T011 Update `OfficeEmployeeNpcRenderer.ts` to consume movement-ready position data from NPC view models without deriving movement targets.
- [x] T012 Keep deterministic position mapping at the renderer boundary and avoid pathfinding or collision-heavy navigation in `OfficeEmployeeNpcRenderer.ts`.
- [x] T013 Ensure renderer cleanup behavior remains unchanged in `OfficeEmployeeNpcRenderer.ts`.

## Phase 5: Scene Integration
- [x] T014 Keep `CompanyOfficeScene.ts` integration one-way from controller view models to renderer updates.
- [x] T015 Ensure no visible project portal, task detail, employee assignment, work-session, activity-log, AI hidden state, or existing NPC visibility behavior changes outside movement-ready data.

## Phase 6: Validation and Review
- [x] T016 Run `npx tsc --noEmit`.
- [x] T017 Run `npm run build`.
- [x] T018 Run `git diff --check`.
- [x] T019 Run `git diff --cached --check`.
- [x] T020 Run `npm run lint` if available, but do not block on the known Next.js lint issue.
- [x] T021 Manually review City to Office transition, office tilemap, existing NPC visibility, Project Portal, Task Detail, Employee Assignment, Work Session start/complete, Activity Log, AI hidden states, and employee simulation snapshots.
- [x] T022 Review architecture checklist: Phaser view-only, movement state separate from rendering objects, EmployeeSimulationService source of truth, no Phaser imports in movement service, no external calls, small isolated PR.

## Deferred Explicitly Out Of Scope
- Pathfinding
- A*
- Collision-heavy routing
- Schedules
- Conversations
- Autonomous AI decision-making
- Animation trees
- Multiplayer sync
- External AI/OpenAI/Codex/MCP/GitHub calls
