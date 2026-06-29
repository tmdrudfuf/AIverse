# Implementation Plan: NPC Conversation Foundation

## Summary
Design a lightweight NPC conversation foundation that can produce deterministic dialogue for visible office employees based on employee simulation state and optional local context. The system prepares later player/NPC interaction while preserving EmployeeSimulationService as the work-state source, keeping Phaser view-only, and avoiding real AI calls, branching dialogue, or complex conversation systems. This architect phase only creates Spec Kit artifacts; no source implementation is included.

## Technical Context
- Next.js, TypeScript, Phaser project.
- Office scene files live under `src/features/city-view/scene/office/`.
- Phase 25 provides employee simulation snapshots.
- Phase 26 provides office NPC placeholder rendering.
- Phase 27 provides non-Phaser NPC movement snapshots.
- Phase 28 provides workstation occupancy snapshots and workstation-aware position hints.
- Phase 29 provides deterministic daily schedule snapshots.
- Phaser remains view-only: renderers consume view models and own display objects only.

## Constitution Check
- Spec, plan, and tasks are created before implementation.
- No source implementation is included in this phase.
- Phaser remains view-only.
- EmployeeSimulationService remains source for task/work state.
- EmployeeNpcMovementService owns movement state but not conversation logic.
- WorkstationOccupancyService owns workstation assignment/occupancy.
- EmployeeDailyScheduleService owns schedule snapshots.
- Conversation state is deterministic advisory output and must not mutate task, employee, movement, workstation, schedule, or rendering state.
- No external APIs, provider calls, real AI execution, LLM prompts, branching dialogue, relationship systems, memory systems, audio, multiplayer sync, or gameplay changes.

## Proposed File Structure
- `src/features/city-view/scene/office/conversations/EmployeeConversationTypes.ts`
- `src/features/city-view/scene/office/conversations/EmployeeConversationService.ts`
- Existing integration points, if implementation proceeds:
  - `OfficeProjectPortalController.ts` can own the service instance and expose `getEmployeeConversation(employeeId)`.
  - `OfficeProjectPortalController.ts` can expose `getNearbyEmployeeConversationTarget(playerPosition)` as a deterministic selection helper if the scene needs it.
  - `OfficeProjectPortalController.ts` can expose `getEmployeeConversationViewModel(employeeId)` for Phaser display.
  - `CompanyOfficeScene.ts` or a future Phaser renderer can detect proximity and request controller view models.
  - `OfficeEmployeeNpcRenderer.ts` should remain focused on NPC display objects unless a separate lightweight bubble renderer is introduced later.

## Architecture Notes
- Conversation output is read-only local state derived from employee simulation state plus optional task, workstation, and schedule context.
- EmployeeSimulationService remains authoritative for idle, assigned, working, and unavailable work state.
- Active assigned/working task state should take priority over schedule-derived break/meeting dialogue.
- Schedule state can provide break/lunch context when the employee is otherwise idle.
- Workstation state can provide location context, but must not become a source of task truth.
- Phaser may detect proximity and display text, but must request already-derived conversation view models from the controller.
- Future AI-generated dialogue should be introduced behind EmployeeConversationService or an AIService dependency without exposing providers to scenes/renderers.

## NPC Conversation Domain Model
Recommended dialogue type:
- `EmployeeDialogueType`: `greeting`, `idle`, `assigned`, `working`, `break`, `unavailable`, `projectStatus`

Recommended conversation result:
- `employeeId`
- `conversationId`
- `speakerName`
- `dialogueText`
- `dialogueType`
- `sourceState`
- `currentTaskTitle?`
- `timestamp`

Recommended conversation input/context:
- `employee`
- `simulationSnapshot`
- `currentTask?`
- `workstationSnapshot?`
- `scheduleSnapshot?`
- `projectName?`

Recommended conversation view model:
- `employeeId`
- `speakerName`
- `dialogueText`
- `dialogueType`
- `displayDurationMs`
- `positionHint?`

## Dialogue Rules
Initial deterministic dialogue can stay simple:
- `working`: mention active task title when available.
- `assigned`: mention preparing for assigned task title when available.
- `unavailable`: use unavailable fallback dialogue.
- schedule `break` or `lunch` while idle: use break dialogue.
- `idle`: use idle or greeting dialogue.
- `projectStatus`: reserved for later project-level status prompts and not automatically shown in this phase.

Dialogue must be deterministic for the same input. Avoid random phrase selection unless selection is derived from stable inputs such as employeeId and dialogueType.

## EmployeeConversationService Responsibilities
`EmployeeConversationService` may:
- generate deterministic dialogue from employee simulation state
- use optional task title, workstation state, and schedule state as local context
- expose read-only conversation results
- provide display-ready conversation view models if useful
- support fallback dialogue when optional context is missing

`EmployeeConversationService` must not:
- import Phaser
- create display objects
- call providers, network APIs, or external AI systems
- mutate task, employee, movement, workstation, schedule, work-session, or renderer state
- own proximity detection, input handling, text bubble lifecycle, branching dialogue, memory, relationships, sentiment, voice/audio, or multiplayer sync

## Controller Responsibilities
Controllers may expose:
- `getEmployeeConversation(employeeId)`
- `getNearbyEmployeeConversationTarget(playerPosition)`
- `getEmployeeConversationViewModel(employeeId)`

Controller responsibilities:
- Gather employee, simulation, task, workstation, and schedule context.
- Call EmployeeConversationService for deterministic dialogue.
- Return read-only conversation/view-model data for Phaser consumers.
- Keep provider and AI implementation details out of scenes/renderers.

## Phaser Interaction Boundary
Phaser-side code may:
- detect simple player/NPC proximity
- request a conversation target or view model from the controller
- show a lightweight text bubble or simple overlay in a later implementation phase
- clean up display objects when the scene exits

Phaser-side code must not:
- generate dialogue text
- infer task or employee business state
- call AIProvider, AIService, providers, or external APIs directly
- own conversation history or persistence

## UI / Display Strategy
Keep the display strategy intentionally small for implementation:
- A future implementation may show a lightweight one-line text bubble near the NPC or a simple overlay.
- No branching dialogue, multi-turn chat, typing animation, dialogue history panel, player choices, voice/audio, or relationship UI.
- Display objects should be disposable and tied to Phaser scene lifecycle.

## Risk Review
- Mixing UI text with business logic: avoid by placing dialogue generation in EmployeeConversationService and exposing view models through the controller.
- Phaser lifecycle cleanup: keep any future bubble renderer owned by Phaser and disposable on scene shutdown.
- Deterministic output: use stable rule-based dialogue and avoid random choices.
- Missing employee/task data: provide fallback dialogue and no-op behavior for unknown employee ids.
- Active work-session priority: assigned/working task state should override schedule break/meeting dialogue.
- Future AI-generated dialogue: keep deterministic service boundaries so AIService can be introduced without changing Phaser consumers.

## Validation Plan For Implementation Phase
- `npx tsc --noEmit`
- `npm run build`
- `git diff --check`
- `git diff --cached --check`
- `npm run lint` if available, non-blocking for the known Next.js lint issue
- Manual regression: City to Office transition, office tilemap, computer interaction, Project Portal, Task Detail, Employee Assignment, Work Session start/complete, Activity Log, Office NPC placeholders, NPC movement snapshots, workstation occupancy snapshots, daily schedule snapshots, NPC renderer cleanup

## Review Checklist
- Phaser remains view-only.
- EmployeeConversationService does not depend on Phaser.
- Dialogue generation is deterministic.
- No external AI/API calls are introduced.
- Controller is the only bridge between scene interaction and conversation state.
- Existing NPC movement, schedule, workstation, employee simulation, and work-session systems remain unchanged.
- Implementation can be done as a small PR.
- Future AI-generated dialogue can replace deterministic dialogue without rewriting renderer/controller boundaries.