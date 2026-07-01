# Tasks: Office Layout & Company Progression Foundation

## Phase 1: Setup
- [x] T001 Confirm Phase 30 conversation files exist in `src/features/city-view/scene/office/conversations/` before implementation.
- [x] T002 Confirm existing NPC movement, workstation, and schedule files exist in `src/features/city-view/scene/office/npc/`, `src/features/city-view/scene/office/workstations/`, and `src/features/city-view/scene/office/schedules/` before implementation.
- [x] T003 Create progression folder `src/features/city-view/scene/office/progression/`.
- [x] T004 Create layout folder `src/features/city-view/scene/office/layout/`.

## Phase 2: Company Progression Domain Foundation
- [x] T005 [P] Add `CompanyProgressionTypes.ts` with company level, stage, milestone, unlocked zone, max employee, layout id, and floor count types in `src/features/city-view/scene/office/progression/CompanyProgressionTypes.ts`.
- [x] T006 Add `CompanyProgressionService.ts` in `src/features/city-view/scene/office/progression/CompanyProgressionService.ts` without Phaser imports.
- [x] T007 Implement deterministic Level 1 Garage Startup progression snapshot in `CompanyProgressionService.ts`.
- [x] T008 Add future Level 2, Level 3, and Level 4+ progression metadata without activating multi-floor gameplay in `CompanyProgressionService.ts`.
- [x] T009 Expose unlocked office zones and active layout metadata from `CompanyProgressionService.ts`.

## Phase 3: Office Layout Domain Foundation
- [x] T010 [P] Add `OfficeLayoutTypes.ts` with layout, floor, zone, furniture slot, workstation slot, meeting slot, break area slot, entry/exit point, and position hint types in `src/features/city-view/scene/office/layout/OfficeLayoutTypes.ts`.
- [x] T011 Add `OfficeLayoutService.ts` in `src/features/city-view/scene/office/layout/OfficeLayoutService.ts` without Phaser imports.
- [x] T012 Implement deterministic Level 1 Garage Startup layout metadata in `OfficeLayoutService.ts`.
- [x] T013 Include office zone types entrance, workspace, workstationArea, meetingArea, breakArea, reception, serverArea, storage, and executiveArea in `OfficeLayoutTypes.ts`.
- [x] T014 Add future Level 2, Level 3, and Level 4+ layout metadata as inactive/future metadata in `OfficeLayoutService.ts`.
- [x] T015 Expose logical zones, position hints, workstation slots, furniture slots, meeting slots, break area slots, and entry/exit points from `OfficeLayoutService.ts`.

## Phase 4: Controller Integration
- [x] T016 Add controller-owned CompanyProgressionService and OfficeLayoutService wiring in `src/features/city-view/scene/office/OfficeProjectPortalController.ts` or the established office controller boundary.
- [x] T017 Add `getCompanyProgressionSnapshot()` or equivalent read-only controller method.
- [x] T018 Add `getActiveOfficeLayout()` or equivalent read-only controller method.
- [x] T019 Add `getOfficeZoneSnapshots()` or equivalent read-only controller method.
- [x] T020 Add `getOfficeLayoutPositionHints()` or equivalent read-only controller method.
- [x] T021 Ensure controller integration does not mutate employee work state, workstation occupancy, movement, schedule, conversation, renderer, economy, or persistence state.

## Phase 5: Existing System Compatibility
- [x] T022 Ensure WorkstationOccupancyService behavior remains unchanged unless it receives optional layout slots in a backward-compatible way.
- [x] T023 Ensure EmployeeNpcMovementService behavior remains unchanged unless it receives optional layout position hints in a backward-compatible way.
- [x] T024 Ensure EmployeeDailyScheduleService behavior remains unchanged unless future layout zone mapping is read-only and optional.
- [x] T025 Ensure EmployeeConversationService remains independent and does not own layout/progression state.
- [x] T026 Ensure no Phaser renderer decides progression, unlocks, or layout business state.

## Phase 6: Validation and Review
- [x] T027 Run `npx tsc --noEmit`.
- [x] T028 Run `npm run build`.
- [x] T029 Run `git diff --check`.
- [x] T030 Run `git diff --cached --check`.
- [x] T031 Run `npm run lint` if available, but do not block on the known Next.js lint issue.
- [x] T032 Manually review City to Office transition, office tilemap, computer interaction, Project Portal, Task Detail, Employee Assignment, Work Session start/complete, Activity Log, Office NPC placeholders, NPC movement snapshots, workstation occupancy snapshots, daily schedule snapshots, deterministic conversation, and renderer cleanup.
- [x] T033 Review architecture checklist: Phaser view-only, progression/layout services have no Phaser dependency, existing NPC systems can consume metadata later, Level 1 startup office metadata exists, no multi-floor gameplay or external calls, small isolated PR.

## Phase 32: Employee AI State Machine Foundation
- [x] T034 Confirm existing employee, simulation, NPC movement, schedule, layout, progression, and controller files before Phase 32 implementation.
- [x] T035 Add `EmployeeAITypes.ts` with EmployeeAIState, EmployeeAIContext, EmployeeAITransition, EmployeeAIConfig, EmployeeAISnapshot, and EmployeeAIUpdateResult types in `src/features/city-view/scene/office/employees/EmployeeAITypes.ts`.
- [x] T036 Add `EmployeeAIService.ts` in `src/features/city-view/scene/office/employees/EmployeeAIService.ts` without Phaser, provider, external API, or random behavior dependencies.
- [x] T037 Implement deterministic initial state creation for idle, walking, working, talking, taking_break, and going_home in `EmployeeAIService.ts`.
- [x] T038 Implement transition validation and helper methods getCurrentState(), canTransitionTo(), transitionTo(), and update() in `EmployeeAIService.ts`.
- [x] T039 Integrate EmployeeAIService lightly in `src/features/city-view/scene/office/OfficeProjectPortalController.ts` with read-only state snapshot exposure.
- [x] T040 Ensure Phase 32 does not change NPC movement, workstation occupancy, daily schedule, conversation, project portal, task, work-session, renderer, progression, or layout behavior.
- [x] T041 Run `npx tsc --noEmit` for Phase 32.
- [x] T042 Run `npm run build` for Phase 32.
- [x] T043 Run `git diff --check` for Phase 32.

## Phase 33: Employee AI State Foundation Tests
- [x] T044 Confirm current package scripts in `package.json`, TypeScript config in `tsconfig.json`, EmployeeAIService in `src/features/city-view/scene/office/employees/EmployeeAIService.ts`, EmployeeAITypes in `src/features/city-view/scene/office/employees/EmployeeAITypes.ts`, and OfficeProjectPortalController integration in `src/features/city-view/scene/office/OfficeProjectPortalController.ts` before adding Employee AI tests.
- [x] T045 Add lightweight TypeScript-compatible test tooling and a test script in `package.json` and `package-lock.json` without introducing browser, provider, LLM, network, or live Phaser runtime requirements.
- [x] T046 [P] Add service-level state resolution tests for idle, walking, working, talking, taking_break, and going_home in `src/features/city-view/scene/office/employees/EmployeeAIService.test.ts`.
- [x] T047 Add transition validation tests for accepted transition metadata, rejected transition preservation, unknown employee transition checks, and custom allowedTransitions config in `src/features/city-view/scene/office/employees/EmployeeAIService.test.ts`.
- [x] T048 Add snapshot stability tests for context summaries, timestamp fallback/context timestamps, sorted updateMany()/getSnapshots() output, and clone immutability in `src/features/city-view/scene/office/employees/EmployeeAIService.test.ts`.
- [x] T049 Add controller integration tests for getEmployeeAIStateSnapshots() read-only composition of simulation, workstation, schedule, movement, progression, and layout context in `src/features/city-view/scene/office/OfficeProjectPortalController.employee-ai.test.ts`.
- [ ] T050 Add controller edge case tests proving Employee AI preview movement uses the latest known movement timestamp strategy and does not mutate NPC movement, workstation occupancy, daily schedule, conversation, work-session, project portal, renderer, progression, or layout behavior in `src/features/city-view/scene/office/OfficeProjectPortalController.employee-ai.test.ts`.
- [ ] T051 Run the Employee AI test script added in `package.json` and verify the command output before marking Phase 33 tests complete.
- [ ] T052 Run `npx tsc --noEmit` for Phase 33.
- [ ] T053 Run `npm run build` for Phase 33.
- [ ] T054 Run `git diff --check` for Phase 33.
- [ ] T055 Run `git diff --cached --check` for Phase 33.

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
- Phase 32 autonomous task assignment
- Phase 32 employee productivity decisions
- Phase 32 real LLM/provider execution
- Phase 32 behavior-driven rendering changes
