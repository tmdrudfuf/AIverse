# Implementation Plan: Daily Schedule Foundation

## Summary
Design a lightweight daily schedule foundation that creates deterministic employee workday routines and exposes schedule snapshots plus movement position intent. The system prepares future office liveliness while preserving EmployeeSimulationService as the source of employee work state, EmployeeNpcMovementService as movement state owner, WorkstationOccupancyService as workstation owner, and Phaser renderers as view-only. This architect phase only creates Spec Kit artifacts; no source implementation is included.

## Technical Context
- Next.js, TypeScript, Phaser project.
- Office scene files live under `src/features/city-view/scene/office/`.
- Phase 25 provides employee simulation snapshots.
- Phase 26 provides office NPC placeholder rendering.
- Phase 27 provides non-Phaser NPC movement snapshots.
- Phase 28 provides workstation occupancy snapshots and workstation-aware position hints.
- Phaser remains view-only: renderers consume view models and own display objects only.

## Constitution Check
- Spec, plan, and tasks are created before implementation.
- No source code implementation is included in this phase.
- Phaser remains view-only.
- EmployeeSimulationService remains source for task/work state.
- EmployeeNpcMovementService owns movement state but not schedule logic.
- WorkstationOccupancyService owns workstation assignment/occupancy.
- Schedule state is deterministic advisory state and must not duplicate or overwrite task/work-session state.
- No external APIs, provider calls, AI execution, real clock synchronization, pathfinding, conversations, schedules editor, payroll/economy, or gameplay changes.

## Proposed File Structure
- `src/features/city-view/scene/office/schedules/EmployeeDailyScheduleTypes.ts`
- `src/features/city-view/scene/office/schedules/EmployeeDailyScheduleService.ts`
- Existing integration points, if implementation proceeds:
  - `OfficeProjectPortalController.ts` can own the service instance and expose `getEmployeeDailyScheduleSnapshots()`.
  - `OfficeProjectPortalController.ts` can expose `getEmployeeNpcViewModelsWithSchedule()` or extend existing NPC view-model derivation.
  - `EmployeeNpcMovementService.ts` can accept schedule position intent as optional input after workstation hints are considered.
  - `WorkstationOccupancyService.ts` remains independent and owns workstation slot decisions.
  - `OfficeEmployeeNpcRenderer.ts` should remain unchanged unless view-model position hints require a new logical zone mapping.

## Architecture Notes
- Schedule snapshots are advisory local state: they can indicate likely availability and desired office area, but they do not own task/work execution.
- EmployeeSimulationService remains the source for whether an employee is idle, assigned, working, or unavailable.
- Active work sessions should take precedence over schedule-driven movement or availability suggestions.
- Workstation occupancy remains the source for specific workstation slots; schedule focusWork intent can ask for a workstation target but cannot assign one.
- Movement consumes resolved position intent from controller/service composition; movement service should not query or derive schedules internally.
- Renderer receives final view models/position hints only and must not infer schedule behavior.

## Daily Schedule Domain Model
Recommended schedule block:
- `EmployeeScheduleBlockType`: `arrive`, `focusWork`, `meeting`, `break`, `lunch`, `leave`

Recommended schedule state:
- `EmployeeScheduleState`: `offDuty`, `arriving`, `available`, `focused`, `inMeeting`, `onBreak`, `atLunch`, `leaving`

Recommended schedule block:
- `blockId`
- `type`
- `label`
- `startMinute`
- `endMinute`
- `positionIntent`

Recommended schedule snapshot:
- `employeeId`
- `scheduleId`
- `currentBlock?`
- `nextBlock?`
- `scheduleState`
- `workdayTime`
- `lastUpdatedAt`

Recommended schedule position intent:
- `zone`: `entrance`, `workstation`, `meetingArea`, `breakArea`, or `idleSpot`
- `slot?`: optional deterministic slot hint when known

## Schedule Block Rules
Initial deterministic schedule can stay simple:
- `arrive`: entrance position intent, schedule state arriving
- `focusWork`: assigned workstation if available through workstation occupancy, otherwise idleSpot, schedule state focused or available depending on active work state
- `meeting`: meetingArea position intent, schedule state inMeeting
- `break`: breakArea position intent, schedule state onBreak
- `lunch`: breakArea position intent, schedule state atLunch
- `leave`: entrance position intent, schedule state leaving or offDuty after block ends

## EmployeeDailyScheduleService Responsibilities
`EmployeeDailyScheduleService` may:
- create deterministic schedules for employees
- resolve current and next schedule blocks from supplied workday time
- expose read-only schedule snapshots
- provide schedule-driven position intent for movement integration
- keep behavior deterministic for the same employee set and workday time

`EmployeeDailyScheduleService` must not:
- import Phaser
- create display objects
- call providers, AI services, network APIs, or project portal UI code
- own task status, work-session status, employee simulation work state, movement state, or workstation occupancy
- implement real clock sync, calendar UI, schedule editor, pathfinding, conversations, payroll/economy, or complex autonomy

## Controller Responsibilities
Controllers may expose:
- `getEmployeeDailyScheduleSnapshots()`
- `getEmployeeNpcViewModelsWithSchedule()`

Controller responsibilities:
- Read employee simulation snapshots, workstation snapshots, and movement view-model data.
- Pass employees and a deterministic workday time into EmployeeDailyScheduleService.
- Resolve schedule position intent and combine it with workstation/movement hints in priority order.
- Keep output one-way for renderer consumption.
- Avoid Phaser object creation and renderer lifecycle work.

## Movement Integration
Schedule position intent can influence movement targets only after higher-priority active work/workstation rules are considered:
- Active assigned/working workstation hint: target reserved/occupied workstation.
- `arrive`: target entrance.
- `focusWork`: target assigned workstation if provided by WorkstationOccupancyService, otherwise idleSpot.
- `meeting`: target meetingArea.
- `break` or `lunch`: target breakArea.
- `leave`: target entrance.
- Off-duty/no block: target idleSpot unless future rules specify otherwise.

EmployeeNpcMovementService should receive schedule-derived position hints from the controller or a small adapter. It should not query schedules or decide schedule blocks internally.

## Interaction With Existing Work State
- Schedule state must not overwrite active work-session state.
- EmployeeSimulationService remains the source for task/work state.
- Schedule can suggest movement/availability, but should not directly complete tasks.
- WorkstationOccupancyService remains source for workstation slots.
- Active work sessions and assigned task workflows should remain stable if a schedule says meeting, break, or lunch.

## Renderer Responsibilities
`OfficeEmployeeNpcRenderer` may:
- receive NPC view models with schedule-influenced position hints
- update placeholder positions from those hints
- continue cleanup of Phaser display objects on scene shutdown/destroy

Renderer must not:
- create schedules or resolve schedule blocks
- infer work state from schedule state
- mutate employee, task, movement, workstation, or schedule state
- create calendar UI, schedule panels, desk sprites, conversations, or animations in this phase

## Risk Review
- Duplicate source of truth: avoid by keeping schedule advisory and EmployeeSimulationService authoritative for work state.
- Deterministic time model: use supplied workday time rather than wall-clock sync in this phase.
- Scene reload behavior: deterministic schedules can rebuild from employees and supplied time; no persistence expected.
- Update triggers: schedule snapshots should update only when controller/service callers request them, without timers or polling.
- Meeting/break conflict with active work: active work-session and workstation signals should take priority over schedule suggestions.
- Future AI-generated schedules: keep provider replacement possible by isolating deterministic schedule generation behind EmployeeDailyScheduleService.

## Validation Plan For Implementation Phase
- `npx tsc --noEmit`
- `npm run build`
- `git diff --check`
- `git diff --cached --check`
- `npm run lint` if available, non-blocking for the known Next.js lint issue
- Manual regression: City to Office transition, office tilemap, computer interaction, Project Portal, Task Detail, Employee Assignment, Work Session start/complete, Activity Log, Office NPC placeholders, NPC movement snapshots, workstation occupancy snapshots, NPC renderer cleanup

## Review Checklist
- Phaser remains view-only.
- EmployeeDailyScheduleService does not depend on Phaser.
- Schedule state does not replace employee work state.
- Movement consumes schedule position intent without owning schedule logic.
- Workstation occupancy remains independent.
- No external API calls are introduced.
- Implementation can be done as a small PR.
- Future AI-generated schedules can replace deterministic mock schedules later.
