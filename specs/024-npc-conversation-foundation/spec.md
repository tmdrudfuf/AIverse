# Feature Specification: NPC Conversation Foundation

## User Stories & Testing

### User Story 1 - Prepare Deterministic Employee Conversations (Priority: P1)
As a player visiting the Daily Proof office, I want visible employee NPCs to have simple deterministic dialogue based on their current state so later interactions can feel responsive without adding real AI calls or complex dialogue systems.

**Independent Test**: Given employee simulation snapshots and related local context, conversation results can be derived deterministically for an employee, include dialogue text and source state, and avoid mutating employee, task, movement, workstation, schedule, or rendering state.

**Acceptance Scenarios**:
1. Given a visible simulated employee exists, when a conversation is requested for that employee, then the result includes employeeId, conversationId, speakerName, dialogueText, dialogueType, sourceState, timestamp, and optional currentTaskTitle.
2. Given an employee is idle, assigned, working, unavailable, on break/lunch, or tied to project status context, when dialogue is generated, then the dialogue type reflects one of greeting, idle, assigned, working, break, unavailable, or projectStatus.
3. Given task, workstation, or schedule context is missing, when a conversation is requested, then deterministic fallback dialogue is still available.
4. Given an employee is assigned or working on an active task, when dialogue is generated, then active task/work state has priority over schedule-only dialogue.
5. Given the implementation is complete, then no real AI, OpenAI, Codex, MCP, GitHub automation, networking, player choices, relationship systems, memory systems, voice/audio, or multiplayer sync are introduced.

## Requirements

### Functional Requirements
- FR-001: NPC conversation state MUST be modeled separately from Phaser rendering objects.
- FR-002: Conversation domain models MUST include employeeId, conversationId, speakerName, dialogueText, dialogueType, sourceState, timestamp, and optional currentTaskTitle.
- FR-003: Dialogue types MUST include greeting, idle, assigned, working, break, unavailable, and projectStatus.
- FR-004: EmployeeConversationService MUST generate deterministic dialogue from employee simulation state.
- FR-005: EmployeeConversationService MAY use task title, workstation state, and schedule state as optional local context.
- FR-006: EmployeeConversationService MUST expose read-only conversation results.
- FR-007: EmployeeConversationService MUST NOT mutate task, employee, movement, workstation, schedule, work-session, or rendering state.
- FR-008: Controller-facing code MAY expose getEmployeeConversation(employeeId), getNearbyEmployeeConversationTarget(playerPosition), and getEmployeeConversationViewModel(employeeId) or equivalent methods.
- FR-009: Phaser-side code MAY detect player/NPC proximity and request a controller-provided conversation view model, but MUST NOT generate dialogue or decide business state.
- FR-010: Conversation display MUST remain simple and bounded to a lightweight text bubble or simple overlay strategy for a later implementation phase.
- FR-011: Conversation behavior MUST be deterministic for the same employee state and local context.
- FR-012: Existing project portal, task detail, employee assignment, work-session, activity-log, AI hidden state, employee simulation, NPC visibility, NPC movement, workstation occupancy, daily schedule, and renderer cleanup behavior MUST remain unchanged.

### Non-Goals
- No source implementation in this architect phase.
- No real LLM prompts, external API calls, player choices, relationship systems, memory systems, sentiment/emotion engine, voice/audio, multiplayer sync, branching dialogue, multi-turn chat, typing animation, or conversation history UI.

## Success Criteria
- SC-001: The implementation plan can be executed as a small isolated PR that adds deterministic conversation results without changing existing gameplay.
- SC-002: Review can verify that Phaser remains view-only and EmployeeConversationService does not depend on Phaser.
- SC-003: Conversation results can be generated for idle, assigned, working, break/lunch, unavailable, greeting, and project-status contexts.
- SC-004: Conversation generation can be replaced later by AIService-backed dialogue without changing Phaser renderer boundaries.
- SC-005: Missing employee/task/workstation/schedule context has deterministic fallback behavior.

## Assumptions
- Phase 29 daily schedule snapshots are available before Phase 30 implementation begins.
- EmployeeSimulationService remains authoritative for employee work state.
- Initial conversation output is local runtime state only and does not persist history.
- Proximity detection and visual display can be implemented later with simple Phaser view objects that request controller view models.