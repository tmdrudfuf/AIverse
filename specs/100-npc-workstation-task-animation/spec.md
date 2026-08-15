# Feature Specification: NPC Workstation Task Animation

**Feature Branch**: `codex/100-npc-workstation-task-animation`

**Created**: 2026-08-14

**Status**: Draft

**Input**: User description: "NPC Workstation Task Animation"

## Current Product Limitation

Office NPCs already move to workstation positions and show labels for assigned or active tasks, but a working employee still appears as a static placeholder once they arrive. Players cannot distinguish an NPC actively working at a workstation from one simply occupying the same spot unless they read the label.

## User Scenarios & Testing

### User Story 1 - See Active Work At Workstations (Priority: P1)

As a player looking at the office, I can see a visible in-scene work animation on an NPC who is actively working at a workstation.

**Why this priority**: This is the core visual proof that assigned work has started and the office is alive.

**Independent Test**: Create a working employee NPC view model whose movement has arrived at a workstation and confirm it exposes an active workstation task animation state and renders an animated work indicator.

**Acceptance Scenarios**:

1. **Given** an employee has a running or in-progress task and is at a workstation, **When** the office NPC view model is created, **Then** the NPC is marked for an active workstation work animation.
2. **Given** that animated view model is rendered, **When** the office scene refreshes, **Then** the NPC keeps its workstation position and displays a bounded work indicator without replacing the name or task label.

---

### User Story 2 - Keep Non-Working NPCs Static (Priority: P2)

As a player, I should not see work animations on idle, assigned-but-not-started, unavailable, or walking NPCs.

**Independent Test**: Create NPC view models for idle, assigned, unavailable, and moving employees and confirm no workstation task animation is active.

**Acceptance Scenarios**:

1. **Given** an employee is only assigned to a task, **When** the NPC is rendered, **Then** no work animation is shown.
2. **Given** a working employee is moving toward a workstation, **When** the NPC is rendered, **Then** no workstation work animation is shown until movement has arrived.
3. **Given** a previously animated NPC becomes idle, assigned, unavailable, or hidden, **When** the renderer refreshes, **Then** stale animation visuals are hidden or destroyed.

---

### User Story 3 - Preserve Read-Only Office State (Priority: P3)

As the office refreshes repeatedly, NPC work animation state stays a read-only projection of existing employee, task, workstation, and movement state.

**Independent Test**: Generate NPC view models and render updates without mutating employees, tasks, work sessions, movement snapshots, workstation snapshots, or schedules.

**Acceptance Scenarios**:

1. **Given** a working employee has a current task, **When** the NPC work animation state is derived, **Then** it copies only display-safe task context and does not change task or employee state.
2. **Given** renderer code updates animation visuals repeatedly, **When** the office state is inspected, **Then** source portal collections and office services remain unchanged.

### Edge Cases

- Working employee not at an arrived workstation: no workstation task animation is shown.
- Employee at workstation with assigned but not started work: no active work animation is shown.
- Long task titles: existing task label truncation remains bounded.
- Existing NPC labels, movement interpolation, insight overlays, knowledge overlays, portal UI, progression HUD, and level-up reaction remain intact.
- Runtime handoff constraints: validation, review, publishing, merge, deployment, GitHub mutation, and primary-repository mutation remain outside this runtime.

## Requirements

### Functional Requirements

- **FR-001**: The office NPC view model MUST identify an active workstation task animation only for employees in a working state whose movement has arrived at a workstation.
- **FR-002**: The work animation state MUST include bounded, display-safe task context for the active task when available.
- **FR-003**: The renderer MUST show a visible animated work indicator for NPCs marked with an active workstation task animation.
- **FR-004**: The renderer MUST hide or destroy work animation visuals when an NPC is no longer visible or no longer has an active workstation task animation.
- **FR-005**: The feature MUST preserve existing NPC labels, placeholder styling, movement interpolation, and task-title truncation behavior.
- **FR-006**: The feature MUST NOT add persistence, network calls, review automation, publishing, deployment, GitHub mutation, or primary-repository mutation.

### Key Entities

- **NPC Work Animation State**: Display-only state indicating whether a visible NPC should show active workstation work animation.
- **Employee NPC View Model**: Existing office NPC projection extended with optional work animation context.
- **Workstation Task Animation Indicator**: In-scene visual attached to an NPC to communicate active task work.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A working employee whose movement has arrived at a workstation produces an active workstation animation state.
- **SC-002**: Idle, assigned, unavailable, and moving employees produce no active workstation animation state.
- **SC-003**: Rendering an active animation state creates visible work-indicator output without changing the NPC label text.
- **SC-004**: Rendering a later inactive state clears the previous work indicator.
- **SC-005**: Generating and rendering work animation state does not mutate source employee, task, movement, workstation, schedule, or work-session data.

## Assumptions

- The existing employee simulation state is the correct source of truth for whether work is active.
- Workstation arrival is determined from the existing NPC movement snapshot.
- The first implementation uses lightweight Phaser placeholder visuals rather than new sprite assets.
- Sound effects, bespoke character sprites, keyboard controls, and durable animation preferences are follow-up scope.
