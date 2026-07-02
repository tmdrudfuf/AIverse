# Tasks: Office NPC Foundation

## Phase 1: Setup
- [x] T001 Confirm Phase 25 employee simulation snapshots exist in `src/features/city-view/scene/office/employees/EmployeeSimulationTypes.ts` and portal state before implementation.
- [x] T002 Create NPC folder `src/features/city-view/scene/office/npc/`.

## Phase 2: View Model Foundation
- [x] T003 Add `EmployeeNpcTypes.ts` with `EmployeeNpcViewModel`, `EmployeeNpcPositionHint`, and placeholder style types in `src/features/city-view/scene/office/npc/EmployeeNpcTypes.ts`.
- [x] T004 Add controller-side view model derivation method such as `getEmployeeNpcViewModels()` without Phaser imports in the appropriate office controller file.
- [x] T005 Join employee simulation snapshots to employee display data and active task title while preserving employee simulation as source of truth.

## Phase 3: Phaser Renderer Foundation
- [x] T006 Add `OfficeEmployeeNpcRenderer.ts` to create simple Phaser containers/placeholders from NPC view models.
- [x] T007 Implement deterministic workspace positioning from `positionHint` without pathfinding or collision navigation.
- [x] T008 Implement label/state text update behavior in `OfficeEmployeeNpcRenderer.ts`.
- [x] T009 Implement renderer cleanup so all NPC Phaser objects are destroyed on scene shutdown/destroy.

## Phase 4: Scene Integration
- [x] T010 Wire renderer lifecycle into `CompanyOfficeScene.ts` without moving employee business logic into Phaser scene code.
- [x] T011 Feed renderer with NPC view models from controller/service state and keep updates one-way from state to view.
- [x] T012 Ensure no visible task assignment, work-session, activity-log, AI hidden state, or project portal behavior changes outside NPC visibility.

## Phase 5: Validation and Review
- [x] T013 Run `npx tsc --noEmit`.
- [x] T014 Run `npm run build`.
- [x] T015 Run `git diff --check`.
- [x] T016 Run `git diff --cached --check`.
- [x] T017 Run `npm run lint` if available, but do not block on the known Next.js lint issue.
- [x] T018 Manually review office scene enter/exit cleanup and regression checklist.
- [x] T019 Review architecture checklist: Phaser view-only, simulation snapshots source of truth, no business logic in renderer, no external calls, small isolated PR.

## Deferred Explicitly Out Of Scope
- Pathfinding
- Animation systems
- Schedules
- Conversations
- Autonomous AI behavior
- Collision-heavy navigation
- Multiplayer sync
- External AI/OpenAI/Codex/MCP/GitHub calls
