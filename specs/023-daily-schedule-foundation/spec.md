# Feature Specification: Daily Schedule Foundation

## User Stories & Testing

### User Story 1 - Prepare Deterministic Employee Daily Schedules (Priority: P1)
As a player visiting the Daily Proof office, I want employee NPCs to have deterministic workday routines so the office can later feel alive through predictable arrivals, focus time, meetings, breaks, lunch, and departures without adding complex AI autonomy.

**Independent Test**: With employee simulation snapshots available, daily schedule snapshots can be derived deterministically for employees, resolve current and next schedule blocks from local workday time, and expose read-only schedule intent without changing task execution, workstation occupancy ownership, NPC rendering, or AI behavior.

**Acceptance Scenarios**:
1. Given visible simulated employees exist, when schedule snapshots are initialized, then each employee can receive a deterministic schedule id and current schedule snapshot.
2. Given a workday time is provided, when schedules are resolved, then each employee has a currentBlock, nextBlock, scheduleState, workdayTime, and lastUpdatedAt.
3. Given a schedule block is arrive, meeting, break, lunch, focusWork, or leave, when movement intent is requested, then the schedule can suggest entrance, meetingArea, breakArea, workstation/idleSpot, or entrance respectively.
4. Given an employee has an active work-session state, when schedule snapshots are resolved, then schedule state does not complete, pause, or overwrite active work-session state.
5. Given workstation occupancy exists, when schedule intent suggests focus work, then workstation assignment remains owned by WorkstationOccupancyService.
6. Given the implementation is complete, then no real clock synchronization, calendar UI, schedule editor, complex autonomy, conversations, pathfinding, payroll/economy, or external API calls are introduced.

## Requirements

### Functional Requirements
- FR-001: Daily schedule state MUST be modeled separately from Phaser rendering objects.
- FR-002: Daily schedule domain models MUST include employeeId, scheduleId, currentBlock, nextBlock, scheduleState, workdayTime, and lastUpdatedAt.
- FR-003: Schedule blocks MUST include arrive, focusWork, meeting, break, lunch, and leave.
- FR-004: Schedule states MUST include offDuty, arriving, available, focused, inMeeting, onBreak, atLunch, and leaving.
- FR-005: EmployeeDailyScheduleService MUST create deterministic schedules for employees.
- FR-006: EmployeeDailyScheduleService MUST resolve the current schedule block from a supplied local workday time.
- FR-007: EmployeeDailyScheduleService MUST expose read-only schedule snapshots.
- FR-008: EmployeeDailyScheduleService MUST provide schedule-driven position intent for movement integration.
- FR-009: Controller-facing code MAY expose getEmployeeDailyScheduleSnapshots() and getEmployeeNpcViewModelsWithSchedule() or equivalent methods.
- FR-010: Schedule position intent MAY influence movement targets but MUST NOT own movement state.
- FR-011: Schedule state MUST NOT replace or overwrite employee work state owned by EmployeeSimulationService.
- FR-012: Schedule state MUST NOT complete tasks, mutate task status, start or stop work sessions, or assign employees.
- FR-013: Schedule focusWork intent MUST defer workstation slot ownership to WorkstationOccupancyService.
- FR-014: Schedule behavior MUST be deterministic for the same employee set and workday time.
- FR-015: Existing project portal, task detail, employee assignment, work-session, activity-log, AI hidden state, employee simulation, NPC visibility, NPC movement, and workstation occupancy behavior MUST remain unchanged except for schedule-ready data becoming available.

### Non-Goals
- No implementation in this architect phase.
- No real clock synchronization, calendar UI, schedule editor, complex autonomy, conversations, pathfinding, payroll/economy, multiplayer sync, external APIs, OpenAI/Codex/MCP/GitHub calls, save/load, or React UI changes.

## Success Criteria
- SC-001: The implementation plan can be executed as a small isolated PR that adds deterministic schedule snapshots without changing existing gameplay.
- SC-002: Review can verify that Phaser remains view-only and EmployeeDailyScheduleService does not depend on Phaser.
- SC-003: Schedule state can suggest movement intent without owning employee work state, movement state, or workstation occupancy.
- SC-004: The schedule model can represent all required blocks and states for each visible simulated employee.
- SC-005: The design can resolve current and next blocks deterministically for a supplied workday time.

## Assumptions
- Phase 28 workstation occupancy snapshots are available before Phase 29 implementation begins.
- Workday time can start as a deterministic local numeric or minute-based value supplied by the controller or service caller.
- Initial schedules can be deterministic mock schedules derived from employee ids or ordering.
- Schedule data is local runtime state only in this phase.
