# Feature Specification: Employee Simulation Foundation

## User Stories & Testing

### User Story 1 - Prepare Hidden Employee Simulation Snapshots (Priority: P1)
As a player managing Daily Proof, I want employees to have local simulation snapshots derived from their task and work state so future office NPCs can consume behavior-ready data without adding visible NPCs yet.

**Independent Test**: Assign an employee, start work, and complete work; verify hidden simulation snapshots can be refreshed from existing employee/task/work-session state while existing gameplay remains unchanged.

**Acceptance Scenarios**:
1. Given employees are loaded, when simulation snapshots are refreshed, then each employee has employeeId, currentState, currentTaskId, currentProjectId, lastStateChangeAt, and displayLabel.
2. Given an employee is assigned to a task, when simulation snapshots refresh, then the employee state can derive as assigned.
3. Given an employee starts work, when simulation snapshots refresh, then the employee state can derive as working.
4. Given an employee is unavailable/offline or has no active work, when simulation snapshots refresh, then the employee state can derive as unavailable or idle.
5. Given simulation snapshots exist, then no visible NPC sprites, animations, pathfinding, schedule, conversation, or gameplay changes occur.

## Requirements

### Functional Requirements
- FR-001: The system MUST define employee simulation domain models with employeeId, currentState, currentTaskId, currentProjectId, lastStateChangeAt, and displayLabel.
- FR-002: Employee simulation states MUST include idle, assigned, working, and unavailable.
- FR-003: EmployeeSimulationService MUST derive simulation state from existing employee, task, and work-session data.
- FR-004: EmployeeSimulationService MUST provide update methods for task assigned, work started, and work completed scenarios.
- FR-005: EmployeeSimulationService MUST expose read-only simulation snapshots for controllers.
- FR-006: EmployeeSimulationService MUST NOT import or depend on Phaser.
- FR-007: Existing employee assignment, work-session, task progression, activity-log, and AI hidden-state behavior MUST remain unchanged.
- FR-008: No visible NPC sprites, pathfinding, animations, schedules, conversations, or real AI behavior may be added.

### Non-Goals
- No Phaser sprite creation, movement, pathfinding, animations, schedule simulation, conversations, UI display, external APIs, networking, save/load, React changes, or real AI behavior.

## Success Criteria
- SC-001: Hidden simulation snapshots are available for loaded employees and update from existing state transitions.
- SC-002: Existing portal, task detail, assignment, work-session, and activity-log behavior remains unchanged.
- SC-003: Future office NPC sprites can consume read-only snapshots without needing new employee source-of-truth data.

## Assumptions
- Employee simulation snapshots are hidden in Phase 25.
- Existing employee/task/work-session state remains the source of truth.