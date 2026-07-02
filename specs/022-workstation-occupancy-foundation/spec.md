# Feature Specification: Workstation Occupancy Foundation

## User Stories & Testing

### User Story 1 - Associate Employee NPCs With Workstations (Priority: P1)
As a player visiting the Daily Proof office, I want employee NPCs to have stable logical workstations so assigned and working employees can later move to and remain at their workstation without changing task, AI, or project gameplay yet.

**Independent Test**: With employee simulation snapshots available, workstation occupancy snapshots can be derived deterministically for employees, reserve or occupy logical workstations based on employee work state, and expose read-only workstation data without adding desk sprites, seating animation, pathfinding, schedules, conversations, or external integrations.

**Acceptance Scenarios**:
1. Given visible simulated employees exist, when workstation occupancy is initialized, then each employee can receive a deterministic workstation assignment where capacity allows.
2. Given an employee becomes assigned to a task, when occupancy snapshots update, then that employee's workstation can become reserved and include the current task id when available.
3. Given an employee starts working, when occupancy snapshots update, then that employee's workstation can become occupied.
4. Given an employee becomes idle or completes work, when occupancy snapshots update, then that employee's workstation can be released according to the local occupancy rules.
5. Given workstation snapshots are exposed, when movement view models are derived, then movement can consume workstation position hints without owning occupancy decisions.
6. Given the implementation is complete, then no desk sprites, workstation UI panels, pathfinding, seating animations, conversations, schedules, resource economy, collision-heavy logic, or external API calls are introduced.

## Requirements

### Functional Requirements
- FR-001: Workstation occupancy MUST be modeled separately from Phaser rendering objects.
- FR-002: Workstation domain models MUST include workstationId, label, positionHint, assignedEmployeeId, occupiedByEmployeeId, currentTaskId, and state.
- FR-003: Workstation states MUST include available, reserved, occupied, and unavailable.
- FR-004: A WorkstationOccupancyService MUST create deterministic workstation assignments for employees.
- FR-005: A workstation MUST become reserved when an employee is assigned to a task and has an assigned workstation.
- FR-006: A workstation MUST become occupied when an employee is working at an assigned workstation.
- FR-007: A workstation MUST be released when work completes or the employee becomes idle, unless future rules explicitly keep a persistent assigned desk.
- FR-008: Workstation snapshots MUST be exposed as read-only data for controllers or view-model derivation.
- FR-009: Controller-facing code MAY expose getWorkstationSnapshots() and getEmployeeNpcViewModelsWithWorkstations() or equivalent methods.
- FR-010: EmployeeSimulationService MUST remain the source of truth for employee work state.
- FR-011: Workstation occupancy MUST NOT duplicate task status, work-session status, or employee work-state ownership.
- FR-012: EmployeeNpcMovementService MAY consume workstation position hints but MUST NOT own workstation occupancy decisions.
- FR-013: Phaser renderers MUST NOT decide workstation assignment, reservation, occupation, or release logic.
- FR-014: The foundation MUST handle zero employees and more employees than available workstations without failing.
- FR-015: Existing project portal, task detail, employee assignment, work-session, activity-log, AI hidden state, employee simulation, NPC visibility, and NPC movement behavior MUST remain unchanged except for workstation-ready data becoming available.

### Non-Goals
- No implementation in this architect phase.
- No desk sprites, workstation UI panels, pathfinding, seating animations, conversations, schedules, resource economy, collision-heavy logic, multiplayer sync, external APIs, OpenAI/Codex/MCP/GitHub calls, save/load, or React UI changes.

## Success Criteria
- SC-001: The implementation plan can be executed as a small isolated PR that adds workstation occupancy snapshots without changing existing gameplay.
- SC-002: Review can verify that Phaser remains view-only and WorkstationOccupancyService does not depend on Phaser.
- SC-003: Movement can receive workstation position hints without owning occupancy decisions.
- SC-004: The occupancy model can represent available, reserved, occupied, and unavailable workstation states for at least the current placeholder employees.
- SC-005: The design can handle zero employees and more employees than workstation slots without introducing errors or ambiguous ownership.

## Assumptions
- Phase 27 NPC movement snapshots are available before Phase 28 implementation begins.
- The initial office can use a small deterministic set of logical workstation slots rather than visible desk sprites.
- Employees may receive deterministic workstation assignments based on stable employee ordering or ids.
- Workstation occupancy is local runtime state only in this phase.
