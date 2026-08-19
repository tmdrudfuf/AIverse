# Feature Specification: Level 2 Reception Desk Runtime Spawn

**Feature Branch**: `codex/109-level-2-reception-desk-runtime-spawn`

**Created**: 2026-08-19

**Status**: Draft

**Input**: User description: "Level 2 Reception Desk Runtime Spawn"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Spawn Reception Runtime Desk At Level 2 (Priority: P1)

As the company reaches level 2, the player sees a usable reception desk appear in the newly unlocked reception area.

**Why this priority**: The level 2 reception unlock needs a concrete in-office interaction point that can route players into the existing workspace/runtime controls.

**Independent Test**: Resolve a level 1 progression snapshot and verify no reception desk object is produced, then resolve a level 2 snapshot with an unlocked reception zone and verify one enabled reception desk interactable is produced.

**Acceptance Scenarios**:

1. **Given** the company is below level 2, **When** the office interaction state is refreshed, **Then** no reception runtime desk is registered.
2. **Given** the company reaches level 2 and reception is unlocked, **When** the office interaction state is refreshed, **Then** a reception desk interactable is registered in the reception zone.

---

### User Story 2 - Open Runtime Workspace From Reception Desk (Priority: P2)

As a player standing near the level 2 reception desk, I can press the normal action key to open the existing project workspace/runtime surface.

**Why this priority**: The reception desk must be functionally useful, not only decorative.

**Independent Test**: Register the reception desk object, consume its interaction, and verify the scene treats its workspace action the same way as the existing computer workspace action.

**Acceptance Scenarios**:

1. **Given** the player is in range of the reception desk, **When** the player activates it, **Then** the existing project workspace opens.
2. **Given** the reception desk becomes unavailable, **When** the player activates the stale prompt, **Then** no workspace opens from stale state.

---

### User Story 3 - Keep Reception Desk Visual State In Sync (Priority: P3)

As office progression changes, the reception desk marker appears or disappears with the current interactable registry.

**Why this priority**: Players need visual feedback that the level 2 reception desk is usable.

**Independent Test**: Refresh the visual layer with an enabled desk object and verify it renders a marker; refresh without the desk and verify the old marker is removed.

**Acceptance Scenarios**:

1. **Given** a level 2 reception desk interactable is enabled, **When** markers refresh, **Then** a reception desk marker is visible.
2. **Given** the reception desk is removed or disabled, **When** markers refresh, **Then** the desk marker is removed.

### Edge Cases

- A layout without a reception zone must not register a desk.
- A level 2 snapshot that does not include reception as an unlocked zone must not register a desk.
- Repeated refreshes must not duplicate the reception desk interactable.
- The feature must not start validation, review, agent runtimes, publishing, merging, deployment, repository mutation, or GitHub mutation from this runtime.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The office MUST derive a reception desk interactable only when the current company progression is level 2 or higher and reception is unlocked.
- **FR-002**: The reception desk interactable MUST be positioned from the active office layout's reception zone.
- **FR-003**: Refreshing office progression state MUST register, replace, or remove the reception desk without creating duplicate interactables.
- **FR-004**: Activating the reception desk MUST open the existing project workspace/runtime surface through the existing interaction flow.
- **FR-005**: The visual layer MUST render enabled desk interactables and remove stale desk markers when refreshed.
- **FR-006**: Existing computer interactions, tilemap-derived interactables, and fallback computer behavior MUST remain unchanged.
- **FR-007**: The feature MUST NOT start validation, review, agent runtime, repository mutation, GitHub mutation, publishing, merging, or deployment.

### Key Entities

- **Reception Runtime Desk**: A level-gated office interactable in the reception zone that opens the project workspace/runtime surface.
- **Company Progression Snapshot**: The current company level and unlocked office zones.
- **Office Layout Snapshot**: The active layout and reception zone position hints used to place the desk.
- **Office Interactable Registry**: The dynamic collection that owns active interaction objects.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Below level 2, refreshing office state results in zero reception runtime desk interactables.
- **SC-002**: At level 2 or higher with reception unlocked, refreshing office state results in exactly one enabled reception runtime desk interactable.
- **SC-003**: Activating the reception desk opens the existing workspace surface using the normal action key.
- **SC-004**: Visual marker refresh removes stale reception desk markers within one refresh cycle.

## Assumptions

- "Runtime spawn" refers to exposing the existing workspace/runtime surface from a level 2 reception desk, not starting a real external agent process.
- The reception desk is local to the in-memory office session and does not need browser-session persistence.
- The active office layout already supplies enough reception-zone position data to place the desk.
