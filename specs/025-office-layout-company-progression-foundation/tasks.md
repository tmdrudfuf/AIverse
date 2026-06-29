# Tasks: Office Layout & Company Progression Foundation

## Phase 1: Setup
- [ ] T001 Confirm Phase 30 conversation files exist in `src/features/city-view/scene/office/conversations/` before implementation.
- [ ] T002 Confirm existing NPC movement, workstation, and schedule files exist in `src/features/city-view/scene/office/npc/`, `src/features/city-view/scene/office/workstations/`, and `src/features/city-view/scene/office/schedules/` before implementation.
- [ ] T003 Create progression folder `src/features/city-view/scene/office/progression/`.
- [ ] T004 Create layout folder `src/features/city-view/scene/office/layout/`.

## Phase 2: Company Progression Domain Foundation
- [ ] T005 [P] Add `CompanyProgressionTypes.ts` with company level, stage, milestone, unlocked zone, max employee, layout id, and floor count types in `src/features/city-view/scene/office/progression/CompanyProgressionTypes.ts`.
- [ ] T006 Add `CompanyProgressionService.ts` in `src/features/city-view/scene/office/progression/CompanyProgressionService.ts` without Phaser imports.
- [ ] T007 Implement deterministic Level 1 Garage Startup progression snapshot in `CompanyProgressionService.ts`.
- [ ] T008 Add future Level 2, Level 3, and Level 4+ progression metadata without activating multi-floor gameplay in `CompanyProgressionService.ts`.
- [ ] T009 Expose unlocked office zones and active layout metadata from `CompanyProgressionService.ts`.

## Phase 3: Office Layout Domain Foundation
- [ ] T010 [P] Add `OfficeLayoutTypes.ts` with layout, floor, zone, furniture slot, workstation slot, meeting slot, break area slot, entry/exit point, and position hint types in `src/features/city-view/scene/office/layout/OfficeLayoutTypes.ts`.
- [ ] T011 Add `OfficeLayoutService.ts` in `src/features/city-view/scene/office/layout/OfficeLayoutService.ts` without Phaser imports.
- [ ] T012 Implement deterministic Level 1 Garage Startup layout metadata in `OfficeLayoutService.ts`.
- [ ] T013 Include office zone types entrance, workspace, workstationArea, meetingArea, breakArea, reception, serverArea, storage, and executiveArea in `OfficeLayoutTypes.ts`.
- [ ] T014 Add future Level 2, Level 3, and Level 4+ layout metadata as inactive/future metadata in `OfficeLayoutService.ts`.
- [ ] T015 Expose logical zones, position hints, workstation slots, furniture slots, meeting slots, break area slots, and entry/exit points from `OfficeLayoutService.ts`.

## Phase 4: Controller Integration
- [ ] T016 Add controller-owned CompanyProgressionService and OfficeLayoutService wiring in `src/features/city-view/scene/office/OfficeProjectPortalController.ts` or the established office controller boundary.
- [ ] T017 Add `getCompanyProgressionSnapshot()` or equivalent read-only controller method.
- [ ] T018 Add `getActiveOfficeLayout()` or equivalent read-only controller method.
- [ ] T019 Add `getOfficeZoneSnapshots()` or equivalent read-only controller method.
- [ ] T020 Add `getOfficeLayoutPositionHints()` or equivalent read-only controller method.
- [ ] T021 Ensure controller integration does not mutate employee work state, workstation occupancy, movement, schedule, conversation, renderer, economy, or persistence state.

## Phase 5: Existing System Compatibility
- [ ] T022 Ensure WorkstationOccupancyService behavior remains unchanged unless it receives optional layout slots in a backward-compatible way.
- [ ] T023 Ensure EmployeeNpcMovementService behavior remains unchanged unless it receives optional layout position hints in a backward-compatible way.
- [ ] T024 Ensure EmployeeDailyScheduleService behavior remains unchanged unless future layout zone mapping is read-only and optional.
- [ ] T025 Ensure EmployeeConversationService remains independent and does not own layout/progression state.
- [ ] T026 Ensure no Phaser renderer decides progression, unlocks, or layout business state.

## Phase 6: Validation and Review
- [ ] T027 Run `npx tsc --noEmit`.
- [ ] T028 Run `npm run build`.
- [ ] T029 Run `git diff --check`.
- [ ] T030 Run `git diff --cached --check`.
- [ ] T031 Run `npm run lint` if available, but do not block on the known Next.js lint issue.
- [ ] T032 Manually review City to Office transition, office tilemap, computer interaction, Project Portal, Task Detail, Employee Assignment, Work Session start/complete, Activity Log, Office NPC placeholders, NPC movement snapshots, workstation occupancy snapshots, daily schedule snapshots, deterministic conversation, and renderer cleanup.
- [ ] T033 Review architecture checklist: Phaser view-only, progression/layout services have no Phaser dependency, existing NPC systems can consume metadata later, Level 1 startup office metadata exists, no multi-floor gameplay or external calls, small isolated PR.

## Deferred Explicitly Out Of Scope
- Multi-floor navigation
- Elevators and stairs
- Pathfinding
- Furniture sprites
- Purchase/build mode
- Economy
- Payroll
- Real AI/OpenAI/Codex/MCP/GitHub calls
- Map editor
- Save/load persistence