# Feature Specification: Dynamic Office Interactable Registration

**Feature Branch**: `codex/108-dynamic-office-interactable-registration`

**Created**: 2026-08-18

**Status**: Draft

**Input**: User description: "Dynamic Office Interactable Registration"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Register Office Interactables Dynamically (Priority: P1)

As the office scene changes, the player can interact with newly available office objects without requiring hard-coded scene wiring for each object.

**Why this priority**: Dynamic registration is the core capability that lets future office layouts and unlocks expose usable objects consistently.

**Independent Test**: Create a registry, register multiple enabled objects after construction, move the founder into each interaction zone, and verify the nearest registered object becomes active.

**Acceptance Scenarios**:

1. **Given** an office scene with an existing interactable registry, **When** a new enabled interactable is registered, **Then** proximity detection includes it immediately.
2. **Given** multiple enabled registered interactables overlap, **When** the founder stands in the overlap, **Then** the closest object is selected with deterministic tie-breaking.

---

### User Story 2 - Update And Remove Interactables (Priority: P2)

As office content changes, disabled, moved, or removed interactables stop showing prompts and stop responding to actions.

**Why this priority**: Progression and layout changes must not leave stale prompts or actions behind.

**Independent Test**: Register an object, update it to disabled or remove it, and verify active-object lookup and action consumption no longer return that object.

**Acceptance Scenarios**:

1. **Given** the founder is inside an enabled interactable zone, **When** that object is disabled, **Then** the active prompt clears on the next update.
2. **Given** an interactable has been removed, **When** the founder remains in its previous zone, **Then** no interaction result is produced for that object.

---

### User Story 3 - Keep Visual Markers In Sync (Priority: P3)

As the set of registered office interactables changes, the office visual markers reflect the current enabled objects rather than a stale construction-time list.

**Why this priority**: The visual layer must match interaction state so players do not see unusable markers or miss newly registered interactables.

**Independent Test**: Render markers from a changing registered object list and verify the visual layer replaces stale markers with the current enabled computer markers.

**Acceptance Scenarios**:

1. **Given** a new enabled computer interactable is registered, **When** the scene refreshes visual markers, **Then** the computer marker appears for that object.
2. **Given** an interactable is disabled or removed, **When** the scene refreshes visual markers, **Then** its marker is removed.

### Edge Cases

- Registering an object with an existing id replaces the old definition instead of creating duplicates.
- Disabled objects remain in the registry for future re-enablement but are ignored by active lookup and marker rendering.
- Removing the active object clears the active selection before another action can consume it.
- Existing tilemap-derived and fallback computer behavior remains unchanged.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The office interactable registry MUST support registering interactable objects after registry construction.
- **FR-002**: Registering an interactable with an existing id MUST replace the prior object definition without duplicating ids.
- **FR-003**: The registry MUST support updating an existing interactable by id while preserving all unchanged fields.
- **FR-004**: The registry MUST support removing an interactable by id and report whether a removal occurred.
- **FR-005**: Active-object lookup MUST consider the current registered object set and ignore disabled objects.
- **FR-006**: Interaction handling MUST clear stale active selections when a selected object is disabled or removed.
- **FR-007**: Visual office markers MUST be refreshable from the current registered object set.
- **FR-008**: Existing tilemap interaction-layer discovery and fallback computer registration MUST keep their current behavior.
- **FR-009**: The feature MUST NOT start validation, review, agent runtime, repository mutation, GitHub mutation, publishing, merging, or deployment.

### Key Entities

- **Office Interactable Registry**: The current in-session collection of interactable office objects.
- **Office Interactive Object**: A selectable object with an id, type, display name, enabled state, action, marker id, and interaction zone.
- **Visual Marker Set**: The rendered representation of enabled interactable objects in the office scene.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: New interactables registered during an office session are available to proximity lookup on the next scene update.
- **SC-002**: Updating or removing an active interactable clears stale prompts/actions within one scene update.
- **SC-003**: Duplicate registration by id results in exactly one object for that id.
- **SC-004**: Existing tilemap-derived interactables and fallback computer behavior remain available after the change.

## Assumptions

- Dynamic registration is local to the in-memory office session for this feature.
- Persisting registered interactables across browser sessions is out of scope.
- Only existing office interactable object types and actions are in scope.
