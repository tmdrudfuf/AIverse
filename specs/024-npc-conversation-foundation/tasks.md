# Tasks: NPC Conversation Foundation

## Phase 1: Setup
- [x] T001 Confirm Phase 29 daily schedule files exist in `src/features/city-view/scene/office/schedules/` before implementation.
- [x] T002 Confirm Phase 26-28 NPC renderer, movement, and workstation files exist in `src/features/city-view/scene/office/npc/` and `src/features/city-view/scene/office/workstations/` before implementation.
- [x] T003 Create conversation folder `src/features/city-view/scene/office/conversations/`.

## Phase 2: Conversation Domain Foundation
- [x] T004 [P] Add `EmployeeConversationTypes.ts` with dialogue type, conversation result, context input, and view-model types in `src/features/city-view/scene/office/conversations/EmployeeConversationTypes.ts`.
- [x] T005 Add `EmployeeConversationService.ts` in `src/features/city-view/scene/office/conversations/EmployeeConversationService.ts` without Phaser imports.
- [x] T006 Implement deterministic dialogue generation from employee simulation state in `EmployeeConversationService.ts`.
- [x] T007 Implement optional task title, workstation state, and schedule state context handling in `EmployeeConversationService.ts`.
- [x] T008 Implement fallback dialogue for missing task, workstation, schedule, or employee context in `EmployeeConversationService.ts`.
- [x] T009 Implement read-only conversation result cloning/exposure in `EmployeeConversationService.ts` if state is cached.

## Phase 3: Controller Integration
- [x] T010 Add controller-owned EmployeeConversationService wiring in `src/features/city-view/scene/office/OfficeProjectPortalController.ts`.
- [x] T011 Add `getEmployeeConversation(employeeId)` or equivalent read-only controller method in `OfficeProjectPortalController.ts`.
- [x] T012 Add `getEmployeeConversationViewModel(employeeId)` or equivalent controller method in `OfficeProjectPortalController.ts`.
- [x] T013 Add `getNearbyEmployeeConversationTarget(playerPosition)` only if an existing scene integration needs a target helper in `OfficeProjectPortalController.ts`.
- [x] T014 Ensure controller conversation derivation gathers employee, task, workstation, and schedule context without mutating those systems in `OfficeProjectPortalController.ts`.

## Phase 4: Phaser Boundary Preparation
- [x] T015 Ensure Phaser scene or renderer code only requests controller conversation view models and does not generate dialogue.
- [x] T016 Add lightweight view-model types needed by future text bubble or overlay rendering without adding the visible UI yet unless explicitly approved.
- [x] T017 Preserve OfficeEmployeeNpcRenderer responsibilities as display-object ownership only in `src/features/city-view/scene/office/npc/OfficeEmployeeNpcRenderer.ts`.

## Phase 5: Behavior Preservation
- [x] T018 Ensure assigned and working employee dialogue prioritizes active task/work state over schedule-only context.
- [x] T019 Ensure idle employees can use schedule break/lunch context for break dialogue when available.
- [x] T020 Ensure conversation service does not mutate tasks, employees, movement snapshots, workstation snapshots, schedule snapshots, work sessions, or renderer state.
- [x] T021 Ensure no provider, AIProvider, external API, networking, real LLM prompt, branching dialogue, memory system, relationship system, voice/audio, or multiplayer code is added.

## Phase 6: Validation and Review
- [x] T022 Run `npx tsc --noEmit`.
- [x] T023 Run `npm run build`.
- [x] T024 Run `git diff --check`.
- [x] T025 Run `git diff --cached --check`.
- [x] T026 Run `npm run lint` if available, but do not block on the known Next.js lint issue.
- [x] T027 Manually review City to Office transition, office tilemap, computer interaction, Project Portal, Task Detail, Employee Assignment, Work Session start/complete, Activity Log, Office NPC placeholders, NPC movement snapshots, workstation occupancy snapshots, daily schedule snapshots, and renderer cleanup.
- [x] T028 Review architecture checklist: Phaser view-only, conversation service has no Phaser dependency, deterministic dialogue, EmployeeSimulationService source of truth, controller bridge only, no external calls, small isolated PR.

## Deferred Explicitly Out Of Scope
- Real LLM prompts
- External API calls
- Player choices
- Relationship systems
- Memory systems
- Sentiment/emotion engine
- Voice/audio
- Multiplayer sync
- Branching dialogue
- Multi-turn chat
- Typing animation
- Conversation history UI