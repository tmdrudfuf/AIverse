# Implementation Plan: Office Layout & Company Progression Foundation

## Summary
Design a lightweight office layout and company progression foundation that represents Daily Proof as a small one-floor startup office at Level 1 and prepares metadata for larger one-floor offices, departmental growth, and future headquarters/multi-floor expansion. This architect phase only creates Spec Kit artifacts; no source implementation is included.

Phase 32 extends this foundation with a deterministic local employee AI state machine that can describe office employee behavior states without connecting real AI, providers, LLMs, or renderer-driven behavior.

## Technical Context
- Next.js, TypeScript, Phaser project.
- Office scene files live under `src/features/city-view/scene/office/`.
- EmployeeSimulationService owns employee work state.
- EmployeeNpcMovementService owns non-Phaser movement state.
- WorkstationOccupancyService owns workstation assignment/occupancy.
- EmployeeDailyScheduleService owns schedule snapshots.
- EmployeeConversationService owns deterministic dialogue.
- EmployeeAIService owns local deterministic employee behavior state metadata only.
- OfficeEmployeeNpcRenderer owns Phaser display objects only.
- Phaser remains view-only: renderers consume view models and own display objects only.

## Constitution Check
- Spec, plan, and tasks are created before implementation.
- No source implementation is included in this phase.
- Phaser remains view-only.
- Company progression and layout metadata must live in non-Phaser services/models.
- Existing NPC systems can consume layout metadata later but must not own progression or duplicate layout state.
- No external APIs, provider calls, real AI execution, multi-floor navigation, economy, build mode, pathfinding, map editor, save/load, or gameplay changes.
- Employee AI state machine logic must remain local, deterministic, and non-Phaser.

## Proposed File Structure
- `src/features/city-view/scene/office/progression/CompanyProgressionTypes.ts`
- `src/features/city-view/scene/office/progression/CompanyProgressionService.ts`
- `src/features/city-view/scene/office/layout/OfficeLayoutTypes.ts`
- `src/features/city-view/scene/office/layout/OfficeLayoutService.ts`
- `src/features/city-view/scene/office/employees/EmployeeAITypes.ts`
- `src/features/city-view/scene/office/employees/EmployeeAIService.ts`
- Existing integration points, if implementation proceeds:
  - `OfficeProjectPortalController.ts` can own service instances and expose progression/layout snapshots.
  - `OfficeProjectPortalController.ts` can expose employee AI state snapshots without changing current office rendering or simulation behavior.
  - `WorkstationOccupancyService.ts` can later accept workstation slots from OfficeLayoutService.
  - `EmployeeNpcMovementService.ts` can later consume layout position hints.
  - `EmployeeDailyScheduleService.ts` can later map schedule intents to layout zones.
  - `OfficeEmployeeNpcRenderer.ts` can later render simple furniture placeholders or zone labels from view models only.

## Architecture Notes
- Company progression is a deterministic local domain model, not a Phaser scene concern.
- Office layout metadata is logical and coordinate-agnostic enough to avoid hardcoding Phaser tile coordinates too early.
- Level 1 Garage Startup is the only active layout in the first implementation phase.
- Future levels should be represented as metadata but not unlocked as playable multi-floor spaces yet.
- Layout zones and slots are the future bridge for workstation occupancy, movement, schedule, and renderer placement.
- The tilemap remains the current visual environment until a later implementation phase explicitly updates rendering.
- Employee AI state machine metadata is advisory foundation data and must not replace EmployeeSimulationService, EmployeeNpcMovementService, EmployeeDailyScheduleService, EmployeeConversationService, or renderer behavior in Phase 32.

## Company Progression Model
Recommended company stage:
- `garageStartup`
- `smallOffice`
- `growingCompany`
- `headquarters`

Recommended progression snapshot:
- `companyLevel`
- `companyStage`
- `unlockedOfficeZones`
- `maxEmployees`
- `requiredMilestones`
- `layoutId`
- `floorCount`

Recommended milestone metadata:
- `milestoneId`
- `label`
- `description`
- `isMet`
- `targetValue?`
- `currentValue?`

## Office Layout Model
Recommended office zone type:
- `entrance`
- `workspace`
- `workstationArea`
- `meetingArea`
- `breakArea`
- `reception`
- `serverArea`
- `storage`
- `executiveArea`

Recommended layout snapshot:
- `layoutId`
- `stage`
- `floorId`
- `zones`
- `furnitureSlots`
- `workstationSlots`
- `meetingSlots`
- `breakAreaSlots`
- `entryExitPoints`

Recommended slot metadata:
- `slotId`
- `zoneId`
- `positionHint`
- `capacity?`
- `label?`
- `reservedFor?`

## Level Metadata
Level 1 - Garage Startup:
- one floor
- 4 to 5 employee capacity
- entrance
- compact workspace/workstation area
- small meeting area
- small break area
- initial workstation slots for current employees

Level 2 - Small Office:
- one floor
- more desks
- clearer meeting room
- reception, break, and storage zones represented as locked/future metadata

Level 3 - Growing Company:
- larger open office
- department zones for frontend, backend, design, and QA represented as future metadata
- multiple meeting areas represented as future metadata

Level 4+ - Headquarters:
- future multi-floor metadata
- elevator/stairs, department floors, executive/research/server spaces represented as future metadata only

## CompanyProgressionService Responsibilities
`CompanyProgressionService` may:
- resolve current company level from local deterministic inputs
- expose the active company progression snapshot
- expose unlocked office zones
- expose active layout id and floor count
- provide future milestone metadata for expansion rules

`CompanyProgressionService` must not:
- import Phaser
- create display objects
- call external APIs or providers
- mutate renderer state
- own employee work state, workstation occupancy, movement, schedule, conversation, economy, payroll, or save/load persistence

## OfficeLayoutService Responsibilities
`OfficeLayoutService` may:
- provide active layout metadata for the current company stage
- expose logical zones and position hints
- expose workstation, furniture, meeting, break area, and entry/exit slots
- provide deterministic Level 1 Garage Startup layout metadata
- prepare future Level 2, Level 3, and Level 4+ layout metadata without enabling those layouts

`OfficeLayoutService` must not:
- import Phaser
- decide progression unlocks
- mutate company progression
- create sprites, tilemaps, furniture objects, pathfinding routes, or multi-floor navigation

## Controller Responsibilities
Controllers may expose:
- `getCompanyProgressionSnapshot()`
- `getActiveOfficeLayout()`
- `getOfficeZoneSnapshots()`
- `getOfficeLayoutPositionHints()`
- `getEmployeeAIStateSnapshots()`

Controller responsibilities:
- Compose progression and layout service outputs.
- Keep output one-way for renderer and existing NPC systems.
- Avoid Phaser object creation and renderer lifecycle work.
- Avoid introducing save/load, economy, payroll, or external integration behavior.

## Employee AI State Model
Recommended employee AI states:
- `idle`
- `walking`
- `working`
- `talking`
- `taking_break`
- `going_home`

Recommended employee AI metadata:
- `EmployeeAIState`
- `EmployeeAIContext`
- `EmployeeAITransition`
- `EmployeeAIConfig`
- `EmployeeAIUpdateResult`

`EmployeeAIService` may:
- create initial employee AI state snapshots
- validate state transitions
- expose current state
- transition to allowed states
- update snapshots from deterministic simulation, movement, schedule, conversation, layout, and progression context

`EmployeeAIService` must not:
- import Phaser
- call external APIs, providers, LLMs, Codex, OpenAI, GitHub, or MCP
- assign tasks, start work sessions, complete work, mutate schedules, mutate movement, or render behavior

## Renderer Responsibilities
Renderers may later:
- consume layout view models or position hints
- render simple furniture placeholders
- render optional zone/debug labels
- use layout metadata for positioning
- clean up Phaser display objects on scene shutdown

Renderers must not:
- decide company level
- own layout business state
- mutate company progression
- assign workstation slots
- make unlock/economy decisions

## Integration With Existing Systems
- WorkstationOccupancyService should eventually consume workstation slots from OfficeLayoutService instead of assuming a fixed workstation count.
- EmployeeNpcMovementService should eventually map logical movement targets to layout position hints.
- EmployeeDailyScheduleService should eventually resolve schedule intents to layout zones such as meeting areas and break areas.
- EmployeeConversationService should remain independent but may use zone labels later for contextual dialogue.
- EmployeeAIService should consume existing snapshots as read-only context and remain independent from provider execution.
- Existing NPC rendering should remain stable during the foundation implementation.

## Risk Review
- Hardcoding Phaser coordinates too early: keep layout position hints logical and service-owned.
- Duplicate layout state between tilemap and services: define layout metadata as advisory foundation until renderer migration is explicit.
- Breaking current NPC placement: initial implementation should preserve existing fallback movement and workstation behavior.
- Future multi-floor expansion: include floorCount and floorId metadata now, but avoid floor navigation logic.
- Workstation slot migration: make slot metadata compatible with current WorkstationOccupancyService but do not force migration beyond the small PR.
- Unlock criteria complexity: start with deterministic mock milestones and avoid economy/payroll dependencies.
- Employee AI ownership creep: keep AI state advisory and local so it does not duplicate or mutate simulation, movement, schedule, or conversation ownership.

## Validation Plan For Implementation Phase
- `npx tsc --noEmit`
- `npm run build`
- `git diff --check`
- `git diff --cached --check`
- `npm run lint` if available, non-blocking for the known Next.js lint issue
- Manual regression: City to Office transition, office tilemap, computer interaction, Project Portal, Task Detail, Employee Assignment, Work Session start/complete, Activity Log, Office NPC placeholders, NPC movement snapshots, workstation occupancy snapshots, daily schedule snapshots, deterministic conversation, NPC renderer cleanup

## Review Checklist
- Phaser remains view-only.
- CompanyProgressionService does not depend on Phaser.
- OfficeLayoutService does not depend on Phaser.
- Existing NPC systems can consume layout metadata later.
- Phase 31 implementation can be done as a small PR.
- Level 1 startup office can improve current screenshot without requiring multi-floor support.
- Future floor unlocks can be added without rewriting the foundation.
