# Tasks: Workstation Occupancy Foundation

## Phase 1: Setup
- [x] T001 Confirm Phase 27 NPC movement files exist in `src/features/city-view/scene/office/npc/` before implementation.
- [x] T002 Confirm Phase 25 employee simulation snapshots exist in `src/features/city-view/scene/office/employees/EmployeeSimulationTypes.ts` before implementation.
- [x] T003 Create workstation folder `src/features/city-view/scene/office/workstations/`.

## Phase 2: Workstation Domain Foundation
- [x] T004 [P] Add `WorkstationTypes.ts` with `WorkstationState`, workstation position hint, and workstation snapshot types in `src/features/city-view/scene/office/workstations/WorkstationTypes.ts`.
- [x] T005 Add `WorkstationOccupancyService.ts` in `src/features/city-view/scene/office/workstations/WorkstationOccupancyService.ts` without Phaser imports.
- [x] T006 Implement deterministic workstation assignment creation in `WorkstationOccupancyService.ts`.
- [x] T007 Implement reserved, occupied, available, and unavailable workstation state derivation in `WorkstationOccupancyService.ts`.
- [x] T008 Implement read-only workstation snapshot exposure in `WorkstationOccupancyService.ts`.
- [x] T009 Ensure zero employees and more employees than workstation slots are handled safely in `WorkstationOccupancyService.ts`.

## Phase 3: Controller Integration
- [x] T010 Add controller-owned WorkstationOccupancyService wiring in `src/features/city-view/scene/office/OfficeProjectPortalController.ts`.
- [x] T011 Add `getWorkstationSnapshots()` or equivalent read-only controller method in `OfficeProjectPortalController.ts`.
- [x] T012 Add `getEmployeeNpcViewModelsWithWorkstations()` or extend existing NPC view-model derivation in `OfficeProjectPortalController.ts` while preserving EmployeeSimulationService as the work-state source.
- [x] T013 Ensure controller workstation derivation has no Phaser imports and does not call providers or external APIs in `OfficeProjectPortalController.ts`.

## Phase 4: Movement Integration
- [x] T014 Update movement target derivation to consume optional workstation position hints in `src/features/city-view/scene/office/npc/EmployeeNpcMovementService.ts` without owning occupancy logic.
- [x] T015 Ensure assigned employees target reserved workstation hints and working employees target occupied workstation hints in movement-ready NPC view models.
- [x] T016 Preserve idle and unavailable movement targets when no workstation hint is active.

## Phase 5: Renderer Boundary
- [x] T017 Ensure `OfficeEmployeeNpcRenderer.ts` continues to consume position hints only and does not decide workstation assignment, reservation, occupation, or release.
- [x] T018 Add renderer logical-zone mapping only if workstation position hints require it in `OfficeEmployeeNpcRenderer.ts`.
- [x] T019 Ensure renderer cleanup behavior remains unchanged in `OfficeEmployeeNpcRenderer.ts`.

## Phase 6: Validation and Review
- [x] T020 Run `npx tsc --noEmit`.
- [x] T021 Run `npm run build`.
- [x] T022 Run `git diff --check`.
- [x] T023 Run `git diff --cached --check`.
- [x] T024 Run `npm run lint` if available, but do not block on the known Next.js lint issue.
- [x] T025 Manually review City to Office transition, office tilemap, computer interaction, Project Portal, Task Detail, Employee Assignment, Work Session start/complete, Activity Log, Office NPC placeholders, NPC movement snapshots, and renderer cleanup.
- [x] T026 Review architecture checklist: Phaser view-only, WorkstationOccupancyService has no Phaser dependency, EmployeeSimulationService source of truth, movement consumes workstation hints without owning occupancy, no external calls, small isolated PR.

## Deferred Explicitly Out Of Scope
- Desk sprites
- Workstation UI panels
- Pathfinding
- Seating animations
- Conversations
- Schedules
- Resource economy
- Collision-heavy logic
- Multiplayer sync
- External AI/OpenAI/Codex/MCP/GitHub calls
