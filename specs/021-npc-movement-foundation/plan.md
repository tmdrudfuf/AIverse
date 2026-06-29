# Implementation Plan: NPC Movement Foundation

## Summary
Design a small NPC movement foundation that derives local movement snapshots from existing employee simulation snapshots and exposes movement-ready NPC view models for the office renderer. This architect phase only prepares Spec Kit artifacts; no source implementation is included.

## Technical Context
- Next.js, TypeScript, Phaser project.
- Office scene files live under `src/features/city-view/scene/office/`.
- Phase 25 provides employee simulation snapshots.
- Phase 26 provides `OfficeEmployeeNpcRenderer` and NPC view models for visible office placeholders.
- Phaser remains view-only: renderers can position display objects, while controllers/services derive movement state and view models.

## Constitution Check
- Spec, plan, and tasks are created before implementation.
- No source code implementation is included in this phase.
- Phaser remains view-only.
- EmployeeSimulationService remains the source for employee work state.
- Movement state is separate from Phaser display objects.
- No external APIs, provider calls, AI execution, pathfinding, animation systems, conversations, schedules, autonomous behavior, or gameplay changes.

## Proposed File Structure
- `src/features/city-view/scene/office/npc/EmployeeNpcMovementTypes.ts`
- `src/features/city-view/scene/office/npc/EmployeeNpcMovementService.ts`
- Existing integration points, if implementation proceeds:
  - `EmployeeNpcTypes.ts` can be extended with movement-aware position fields if needed.
  - `OfficeProjectPortalController.ts` can expose `getEmployeeMovementSnapshots()` and `getEmployeeNpcViewModelsWithMovement()`.
  - `CompanyOfficeScene.ts` can keep feeding renderer view models one-way.
  - `OfficeEmployeeNpcRenderer.ts` can update placeholder positions from view-model position data only.

## Architecture Notes
- Employee simulation snapshots remain the source of truth for employee work state.
- NPC movement snapshots are derived local state for presentation and should not duplicate employee assignment/work-session truth.
- Movement service must not import Phaser or create display objects.
- Renderer must not assign targets, infer employee business state, mutate simulation state, or decide behavior.
- Logical positions should be stable names first; mapping to Phaser world coordinates remains a renderer or scene-view concern.
- Future animated NPCs or pathfinding should consume movement snapshots and replace only the movement-update/rendering internals, not the employee simulation source.

## NPC Movement Domain Model
Recommended movement state:
- `EmployeeNpcMovementState`: `idle`, `moving`, `arrived`

Recommended logical position:
- `OfficeNpcLogicalPosition`: `entrance`, `workstation`, `meetingArea`, `breakArea`, `idleSpot`

Recommended movement snapshot:
- `employeeId`
- `currentPosition`: logical office position plus optional slot
- `targetPosition`: logical office position plus optional slot
- `movementState`
- `speed`
- `lastUpdatedAt`
- `positionHint`: renderer-friendly hint derived from logical position and slot

Recommended position object:
- `zone`: logical position name
- `slot`: deterministic numeric slot

## Target Position Rules
Initial deterministic target mapping can stay simple:
- `idle` employee simulation state -> `idleSpot`
- `assigned` employee simulation state -> `workstation`
- `working` employee simulation state -> `workstation` or `meetingArea`, depending on current task/work-session context if available
- `unavailable` employee simulation state -> `breakArea`

Rules should be explicit and local-only. They must not call AI services, providers, or external systems.

## Movement Service Responsibilities
`EmployeeNpcMovementService` may:
- derive initial movement snapshots from employee simulation snapshots
- assign deterministic target positions from employee simulation state
- update movement state over elapsed time or a supplied timestamp
- keep movement updates deterministic for the same inputs
- expose read-only movement snapshots

`EmployeeNpcMovementService` must not:
- import Phaser
- create display objects
- call providers, AI services, network APIs, or project portal UI code
- perform pathfinding, route planning, collision-heavy navigation, schedules, or autonomous AI decisions

## Controller Responsibilities
Controllers may expose:
- `getEmployeeMovementSnapshots()`
- `getEmployeeNpcViewModelsWithMovement()`

Controller responsibilities:
- Read employee simulation snapshots.
- Pass snapshots through movement service.
- Join movement snapshots into NPC view models.
- Keep view-model output disposable and one-way for the renderer.
- Avoid Phaser object creation or renderer lifecycle work.

## Phaser Renderer Responsibilities
`OfficeEmployeeNpcRenderer` may:
- receive movement-ready NPC view models
- update simple placeholder positions from view-model position data
- keep labels and placeholder state readable
- continue destroying all display objects cleanly on scene shutdown/destroy

Renderer must not:
- derive movement targets from employee task/AI state
- mutate movement snapshots
- call services/providers
- implement pathfinding, schedules, conversations, autonomous behavior, or animation trees

## Risk Review
- Duplicate source of truth: avoid by deriving movement targets from EmployeeSimulationService snapshots and storing only movement presentation state.
- Phaser coordinate coupling: keep logical office positions in movement state and map to world coordinates at the renderer boundary.
- Scene lifecycle cleanup: renderer remains responsible for display-object cleanup; movement service owns no Phaser objects.
- Movement update frequency: implementation should avoid heavy per-frame business work and keep calculations deterministic and cheap.
- Deterministic behavior: target selection should be stable by employee id/slot, not random.
- Future pathfinding support: keep route planning out of the initial model but leave room for target positions and movement states to be extended later.

## Validation Plan For Implementation Phase
- `npx tsc --noEmit`
- `npm run build`
- `git diff --check`
- `git diff --cached --check`
- `npm run lint` if available, non-blocking for the known Next.js lint issue
- Manual regression: City to Office transition, office tilemap, existing NPC placeholder visibility, Project Portal, Task Detail, Employee Assignment, Work Session start/complete, Activity Log, AI hidden states, EmployeeSimulationService snapshots

## Review Checklist
- Phaser remains view-only.
- Movement state is separate from rendering objects.
- EmployeeSimulationService remains source for employee work state.
- MovementService does not depend on Phaser.
- Renderer receives view models only.
- No external API calls are introduced.
- Implementation can be done as a small PR.
- Future pathfinding, animation, and conversation systems can be added without rewriting this foundation.
