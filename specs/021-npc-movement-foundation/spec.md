# Feature Specification: NPC Movement Foundation

## User Stories & Testing

### User Story 1 - Prepare Office NPCs for Simple Movement (Priority: P1)
As a player visiting the Daily Proof office, I want visible employee NPCs to have a foundation for moving between logical office positions so the office can feel more alive in later phases without changing task, AI, or project gameplay yet.

**Independent Test**: With employee simulation snapshots available, the system can derive movement snapshots for visible employee NPCs, assign deterministic logical office targets, and expose movement-ready NPC view models without adding pathfinding, animation systems, autonomous behavior, or external integrations.

**Acceptance Scenarios**:
1. Given an employee simulation snapshot exists, when NPC movement state is derived, then the employee has a movement snapshot with employeeId, currentPosition, targetPosition, movementState, speed, lastUpdatedAt, and positionHint.
2. Given an employee state changes between idle, assigned, and working, when movement snapshots refresh, then target logical positions can update deterministically from employee simulation state.
3. Given a movement update occurs, when the NPC has not reached its target yet, then the movement state can be represented as moving without requiring pathfinding or collision-heavy routing.
4. Given a movement update reaches the target, when snapshots are exposed to controllers/renderers, then the movement state can be represented as arrived or idle.
5. Given the implementation is complete, then no conversations, schedules, autonomous AI decision-making, animation trees, multiplayer sync, external APIs, OpenAI/Codex/MCP/GitHub calls, or real pathfinding are introduced.

## Requirements

### Functional Requirements
- FR-001: NPC movement state MUST be derived from employee simulation snapshots and existing local office data, not from an independent employee work-state source of truth.
- FR-002: Movement domain models MUST include employeeId, currentPosition, targetPosition, movementState, speed, lastUpdatedAt, and positionHint.
- FR-003: Movement states MUST include idle, moving, and arrived.
- FR-004: Logical office positions MUST include entrance, workstation, meetingArea, breakArea, and idleSpot.
- FR-005: A movement service MUST derive initial movement snapshots from employee simulation snapshots without depending on Phaser.
- FR-006: A movement service MUST assign simple deterministic target positions based on employee simulation state.
- FR-007: A movement service MUST expose read-only movement snapshots for controllers or renderers.
- FR-008: Controllers MAY expose employee movement snapshots and NPC view models enriched with movement data.
- FR-009: Phaser-side rendering MUST receive movement-ready NPC view models and MUST NOT own movement or business decisions.
- FR-010: Movement foundation MUST NOT add pathfinding, A*, collision-heavy routing, schedules, conversations, autonomous AI behavior, animation trees, multiplayer sync, or external API calls.
- FR-011: Existing project portal, task detail, employee assignment, work-session, activity-log, AI hidden state, employee simulation, and office NPC visibility behavior MUST remain unchanged except for movement-ready data becoming available.

### Non-Goals
- No implementation in this architect phase.
- No visible walking behavior is required in the architect artifacts.
- No pathfinding, A*, collision-heavy routing, schedules, conversations, autonomous AI decision-making, animation trees, multiplayer sync, external APIs, OpenAI/Codex/MCP/GitHub calls, save/load, or React UI changes.

## Success Criteria
- SC-001: The implementation plan can be executed as a small isolated PR that adds movement domain state and movement-ready view models without changing existing gameplay.
- SC-002: Review can verify that Phaser remains view-only and movement state remains separate from renderer-owned display objects.
- SC-003: Future pathfinding, animation, and conversation systems can consume or extend the movement foundation without replacing EmployeeSimulationService as the employee work-state source.
- SC-004: The movement model can represent at least one deterministic target position for each visible simulated employee.

## Assumptions
- Phase 26 office NPC placeholders are already visible and controlled by `OfficeEmployeeNpcRenderer`.
- EmployeeSimulationService snapshots remain available before Phase 27 implementation begins.
- Initial movement can use simple deterministic logical position hints rather than exact route planning.
- Renderer-level world coordinates can remain a view concern while movement service owns logical movement state.
