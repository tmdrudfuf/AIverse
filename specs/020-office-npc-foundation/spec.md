# Feature Specification: Office NPC Foundation

## User Stories & Testing

### User Story 1 - Render Simulated Employees as Office NPCs (Priority: P1)
As a player visiting the Daily Proof office, I want simulated employees to become visible as simple office NPCs so the workspace feels populated while continuing to use employee simulation snapshots as the source of truth.

**Independent Test**: With employee simulation snapshots available, the office scene can render simple employee placeholders with labels and cleanly destroy them on scene exit without changing task, assignment, work-session, or AI behavior.

**Acceptance Scenarios**:
1. Given employee simulation snapshots exist, when the office NPC renderer receives view models, then one simple visible NPC placeholder can be created per visible employee.
2. Given an employee simulation state changes, when view models refresh, then the visible NPC label/state can update from the simulation snapshot.
3. Given the office scene exits or the renderer is destroyed, when cleanup runs, then all NPC Phaser objects are destroyed cleanly.
4. Given the implementation is complete, then no pathfinding, animation system, conversations, schedules, autonomous AI behavior, or collision-heavy navigation is introduced.

## Requirements

### Functional Requirements
- FR-001: Office NPC state MUST be derived from EmployeeSimulationService snapshots, not from an independent NPC source of truth.
- FR-002: The controller-facing layer MUST expose employee NPC view models or visible employee snapshots for the office scene.
- FR-003: NPC view models MUST include employeeId, displayName, displayLabel, state, currentTaskTitle, positionHint, and spriteKey or placeholderStyle.
- FR-004: Phaser-side rendering MUST be limited to creating, updating, positioning, labeling, and destroying simple NPC placeholders.
- FR-005: Phaser renderers MUST NOT contain employee business logic, task status logic, AI calls, or provider calls.
- FR-006: NPC objects MUST be cleaned up when the office scene exits or the renderer is destroyed.
- FR-007: Existing project portal, task detail, employee assignment, work-session, activity-log, AI hidden state, and employee simulation behavior MUST remain unchanged.

### Non-Goals
- No implementation in this architect phase.
- No pathfinding, animation system, schedules, conversations, autonomous AI behavior, collision-heavy navigation, multiplayer sync, external APIs, OpenAI/Codex/MCP/GitHub calls, save/load, or React UI changes.

## Success Criteria
- SC-001: The implementation plan can be executed as a small isolated PR that adds simple NPC rendering from existing simulation snapshots.
- SC-002: Future animated NPCs can replace placeholder rendering without changing employee simulation as the source of truth.
- SC-003: Review can verify that Phaser remains view-only and NPC state remains derived from employee simulation snapshots.

## Assumptions
- Phase 25 employee simulation snapshots are available before Phase 26 implementation begins.
- Initial NPC positions can use simple deterministic office workspace hints rather than pathfinding or tile collision behavior.
- Simple text/rectangle placeholders are acceptable for the first visible NPC implementation unless sprite assets already exist.