# Implementation Plan: Workstation Occupancy Foundation

## Summary
Design a lightweight workstation occupancy foundation that associates simulated employees with logical office workstations. The foundation prepares assigned and working employee NPCs to target workstation position hints while preserving EmployeeSimulationService as the employee work-state source and keeping Phaser renderers view-only. This architect phase only creates Spec Kit artifacts; no source implementation is included.

## Technical Context
- Next.js, TypeScript, Phaser project.
- Office scene files live under `src/features/city-view/scene/office/`.
- Phase 25 provides employee simulation snapshots.
- Phase 26 provides office NPC placeholder rendering.
- Phase 27 provides non-Phaser NPC movement snapshots and movement-ready view models.
- Phaser remains view-only: renderers consume view models and own display objects only.

## Constitution Check
- Spec, plan, and tasks are created before implementation.
- No source code implementation is included in this phase.
- Phaser remains view-only.
- EmployeeSimulationService remains source for employee work state.
- EmployeeNpcMovementService owns movement state but not occupancy decisions.
- Workstation occupancy is a separate domain service and must not duplicate task or employee work-state ownership.
- No external APIs, provider calls, AI execution, pathfinding, seating animation, conversations, schedules, resource economy, collision-heavy logic, or gameplay changes.

## Proposed File Structure
- `src/features/city-view/scene/office/workstations/WorkstationTypes.ts`
- `src/features/city-view/scene/office/workstations/WorkstationOccupancyService.ts`
- Existing integration points, if implementation proceeds:
  - `OfficeProjectPortalController.ts` can own the service instance and expose `getWorkstationSnapshots()`.
  - `OfficeProjectPortalController.ts` can expose `getEmployeeNpcViewModelsWithWorkstations()` or extend existing NPC view-model derivation.
  - `EmployeeNpcMovementService.ts` can accept workstation position hints as optional inputs for target selection.
  - `OfficeEmployeeNpcRenderer.ts` should remain unchanged unless view-model position hints require a new logical zone mapping.

## Architecture Notes
- Employee simulation snapshots remain the source of truth for work state such as idle, assigned, working, and unavailable.
- Workstation occupancy snapshots are derived local presentation/domain state: they describe desk assignment, reservation, occupation, and release, but do not own task state.
- Movement may consume workstation position hints to select targets, but occupancy service decides which workstation belongs to which employee.
- Renderer receives only view models/position hints and must not infer workstation state.
- Deterministic assignment is preferred over random assignment so scene reloads and review are predictable.
- Workstation data remains local runtime state; no save/load or persistence is designed in this phase.

## Workstation Domain Model
Recommended workstation state:
- `WorkstationState`: `available`, `reserved`, `occupied`, `unavailable`

Recommended position hint:
- `zone`: `workstation`
- `slot`: deterministic numeric slot

Recommended workstation snapshot:
- `workstationId`
- `label`
- `positionHint`
- `assignedEmployeeId?`
- `occupiedByEmployeeId?`
- `currentTaskId?`
- `state`

Recommended service input:
- employee simulation snapshots
- loaded project tasks if available
- previous workstation snapshots if needed for stable assignments

## Occupancy Rules
Initial deterministic rules should stay simple:
- Idle employee: no active reservation or occupation; workstation may be released.
- Assigned employee: reserve assigned workstation and include currentTaskId when available.
- Working employee: mark assigned workstation occupied and include currentTaskId when available.
- Unavailable employee: release active workstation and target breakArea/idle position through movement.
- More employees than workstation slots: assign available slots deterministically and leave overflow employees without workstation assignment or use a documented overflow strategy.
- Zero employees: return an empty or all-available workstation snapshot set without errors.

## WorkstationOccupancyService Responsibilities
`WorkstationOccupancyService` may:
- create deterministic workstation assignments for employees
- reserve a workstation when an employee is assigned a task
- mark workstation occupied when employee starts work
- release workstation when work completes or employee becomes idle
- expose read-only workstation snapshots
- preserve deterministic assignment stability across updates where possible

`WorkstationOccupancyService` must not:
- import Phaser
- create display objects
- call providers, AI services, network APIs, or project portal UI code
- own task status, work-session status, or employee simulation work-state truth
- implement pathfinding, seating animation, schedules, conversations, resource economy, or collision-heavy logic

## Controller Responsibilities
Controllers may expose:
- `getWorkstationSnapshots()`
- `getEmployeeNpcViewModelsWithWorkstations()`

Controller responsibilities:
- Read employee simulation snapshots and loaded task data.
- Pass employee/task state into WorkstationOccupancyService.
- Join workstation snapshots into NPC movement/view-model derivation.
- Keep output one-way for renderer consumption.
- Avoid Phaser object creation and renderer lifecycle work.

## Movement Integration
Movement target rules may consume workstation position hints:
- `idle`: target `idleSpot` unless a future persistent-desk rule explicitly says otherwise.
- `assigned`: target assigned/reserved workstation.
- `working`: target occupied workstation.
- `unavailable`: target `breakArea` or `idleSpot`.

EmployeeNpcMovementService should receive any workstation-derived position hint as input from the controller or a small adapter. It should not query or decide workstation occupancy internally.

## Renderer Responsibilities
`OfficeEmployeeNpcRenderer` may:
- receive NPC view models with workstation-derived position hints
- update placeholder positions from those hints
- continue cleanup of Phaser display objects on scene shutdown/destroy

Renderer must not:
- assign, reserve, occupy, or release workstations
- inspect tasks to infer workstation state
- mutate employee, task, movement, or workstation state
- create desk sprites or workstation UI panels in this phase

## Risk Review
- Duplicate source of truth: avoid by keeping employee work state in EmployeeSimulationService and workstation state limited to occupancy snapshots.
- Releasing workstations safely: release only from derived idle/completed state and preserve task history elsewhere.
- Deterministic assignment stability: assignments should be based on stable employee ids/order and previous snapshots, not random selection.
- Scene reload behavior: local runtime snapshots can rebuild deterministically; no persistence expectations in this phase.
- Zero employees / more employees than desks: service must return safe snapshots and documented overflow behavior.
- Future desk sprites and animations: keep workstation snapshots independent of Phaser display objects.

## Validation Plan For Implementation Phase
- `npx tsc --noEmit`
- `npm run build`
- `git diff --check`
- `git diff --cached --check`
- `npm run lint` if available, non-blocking for the known Next.js lint issue
- Manual regression: City to Office transition, office tilemap, computer interaction, Project Portal, Task Detail, Employee Assignment, Work Session start/complete, Activity Log, Office NPC placeholders, NPC movement snapshots, NPC renderer cleanup

## Review Checklist
- Phaser remains view-only.
- WorkstationOccupancyService does not depend on Phaser.
- Employee work state remains owned by EmployeeSimulationService.
- Workstation occupancy does not duplicate task state.
- Movement consumes workstation position hints without owning occupancy logic.
- Renderer receives view models only.
- No external API calls are introduced.
- Implementation can be done as a small PR.
- Future desk sprites and animations can be added without rewriting this foundation.
