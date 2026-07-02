# Tasks: Daily Schedule Foundation

## Phase 1: Setup
- [x] T001 Confirm Phase 28 workstation occupancy files exist in `src/features/city-view/scene/office/workstations/` before implementation.
- [x] T002 Confirm Phase 27 NPC movement files exist in `src/features/city-view/scene/office/npc/` before implementation.
- [x] T003 Create schedule folder `src/features/city-view/scene/office/schedules/`.

## Phase 2: Daily Schedule Domain Foundation
- [x] T004 [P] Add `EmployeeDailyScheduleTypes.ts` with schedule block, schedule state, position intent, and schedule snapshot types in `src/features/city-view/scene/office/schedules/EmployeeDailyScheduleTypes.ts`.
- [x] T005 Add `EmployeeDailyScheduleService.ts` in `src/features/city-view/scene/office/schedules/EmployeeDailyScheduleService.ts` without Phaser imports.
- [x] T006 Implement deterministic schedule creation for employees in `EmployeeDailyScheduleService.ts`.
- [x] T007 Implement current and next block resolution from supplied workday time in `EmployeeDailyScheduleService.ts`.
- [x] T008 Implement schedule state derivation for offDuty, arriving, available, focused, inMeeting, onBreak, atLunch, and leaving in `EmployeeDailyScheduleService.ts`.
- [x] T009 Implement read-only schedule snapshot exposure in `EmployeeDailyScheduleService.ts`.
- [x] T010 Implement schedule-driven position intent derivation in `EmployeeDailyScheduleService.ts`.

## Phase 3: Controller Integration
- [x] T011 Add controller-owned EmployeeDailyScheduleService wiring in `src/features/city-view/scene/office/OfficeProjectPortalController.ts`.
- [x] T012 Add `getEmployeeDailyScheduleSnapshots()` or equivalent read-only controller method in `OfficeProjectPortalController.ts`.
- [x] T013 Add `getEmployeeNpcViewModelsWithSchedule()` or extend existing NPC view-model derivation in `OfficeProjectPortalController.ts` while preserving EmployeeSimulationService as the work-state source.
- [x] T014 Ensure controller schedule derivation has no Phaser imports and does not call providers or external APIs in `OfficeProjectPortalController.ts`.

## Phase 4: Movement and Workstation Integration
- [x] T015 Update movement target composition to consume optional schedule position intent in `src/features/city-view/scene/office/OfficeProjectPortalController.ts` or a small non-Phaser helper.
- [x] T016 Ensure active workstation hints remain higher priority than schedule focusWork intent for assigned/working employees.
- [x] T017 Ensure arrive and leave intents target entrance, meeting targets meetingArea, and break/lunch targets breakArea.
- [x] T018 Preserve idle, assigned, working, unavailable, workstation occupancy, and work-session behavior when schedule intent exists.

## Phase 5: Renderer Boundary
- [x] T019 Ensure `OfficeEmployeeNpcRenderer.ts` continues to consume position hints only and does not resolve schedule blocks.
- [x] T020 Add renderer logical-zone mapping only if schedule position hints require a new supported zone in `OfficeEmployeeNpcRenderer.ts`.
- [x] T021 Ensure renderer cleanup behavior remains unchanged in `OfficeEmployeeNpcRenderer.ts`.

## Phase 6: Validation and Review
- [x] T022 Run `npx tsc --noEmit`.
- [x] T023 Run `npm run build`.
- [x] T024 Run `git diff --check`.
- [x] T025 Run `git diff --cached --check`.
- [x] T026 Run `npm run lint` if available, but do not block on the known Next.js lint issue.
- [x] T027 Manually review City to Office transition, office tilemap, computer interaction, Project Portal, Task Detail, Employee Assignment, Work Session start/complete, Activity Log, Office NPC placeholders, NPC movement snapshots, workstation occupancy snapshots, and renderer cleanup.
- [x] T028 Review architecture checklist: Phaser view-only, schedule service has no Phaser dependency, EmployeeSimulationService source of truth, movement consumes schedule intent without owning schedule logic, workstation occupancy independent, no external calls, small isolated PR.

## Deferred Explicitly Out Of Scope
- Real clock synchronization
- Calendar UI
- Schedule editor
- Complex autonomy
- Conversations
- Pathfinding
- Payroll/economy
- Multiplayer sync
- External AI/OpenAI/Codex/MCP/GitHub calls
