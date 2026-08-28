# Feature Specification: Operator-Driven Office Navigation Foundation

**Feature Branch**: `codex/131-operator-driven-office-navigation-foundation`

**Created**: 2026-08-28

**Status**: Draft

**Input**: User description: "Operator-Driven Office Navigation Foundation"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Drag to Navigate the Office and City (Priority: P1)

An AIverse operator can pan around the city and office with a pointer drag so they can inspect spaces without moving the Founder avatar to every area first.

**Why this priority**: Pointer navigation is the core operator-driven navigation behavior and makes the office surface directly inspectable.

**Independent Test**: Start in the city or office scene, drag the scene surface, and verify the camera pans while staying within the playable bounds.

**Acceptance Scenarios**:

1. **Given** the city scene is visible, **When** the operator drags across the scene surface, **Then** the camera pans in the drag direction and does not leave the city bounds.
2. **Given** the office scene is visible, **When** the operator drags across the scene surface, **Then** the camera pans independently of Founder movement and remains inside the office bounds.

---

### User Story 2 - Click to Enter Buildings and Open Work Areas (Priority: P2)

An AIverse operator can click an active company building or office interactive object to enter or open the relevant workspace without first walking the Founder into a proximity zone.

**Why this priority**: Direct click actions make navigation operator-driven rather than avatar-proximity-only, while preserving existing keyboard interaction behavior.

**Independent Test**: Click the active company building from the city and click a workspace-capable office object from the office, then verify the expected transition or portal opens.

**Acceptance Scenarios**:

1. **Given** the active company building is visible in the city, **When** the operator clicks within the building interaction area, **Then** the office scene opens for that building.
2. **Given** a workspace-capable office object is visible, **When** the operator clicks within its interaction area, **Then** the project workspace portal opens.

---

### User Story 3 - Avoid Accidental Click Actions During Drag or Overlay Use (Priority: P3)

An AIverse operator can drag to pan and use blocking overlays without stale pointer events accidentally entering buildings or opening workspace interactions.

**Why this priority**: Operator-driven navigation must remain predictable; drag gestures and open overlays must not trigger unintended actions.

**Independent Test**: Drag across clickable objects and use the project portal overlay, then verify no stale click action is consumed when pointer interaction is disabled or the movement exceeds the click threshold.

**Acceptance Scenarios**:

1. **Given** a clickable building or office object is under the pointer, **When** the operator performs a drag gesture instead of a click, **Then** no building entry or office interaction is queued.
2. **Given** the project workspace portal is open, **When** pointer input occurs behind the overlay, **Then** scene panning and office object clicks are disabled until the overlay is closed.

### Edge Cases

- Pointer coordinates may be missing or invalid; the system ignores those events without changing scene state.
- Disabled or future-site buildings do not become clickable entry targets.
- Pointer drag deltas are cleared when pointer navigation is disabled so stale camera movement is not applied after overlays close.
- Existing keyboard movement, keyboard zoom, wheel zoom, and proximity-based action behavior continue to work.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST support pointer drag panning in city and office scenes.
- **FR-002**: The system MUST keep pointer-panned cameras within the configured scene bounds.
- **FR-003**: The system MUST stop following the Founder camera target when the operator is actively panning by pointer.
- **FR-004**: The system MUST resume Founder camera focus when the operator uses keyboard movement.
- **FR-005**: The system MUST allow a direct click on an active, enabled company building to request office entry.
- **FR-006**: The system MUST allow a direct click on an enabled workspace-capable office object to open the project workspace portal.
- **FR-007**: The system MUST distinguish clicks from drags using a bounded pointer movement threshold.
- **FR-008**: The system MUST ignore direct click interactions while a blocking project workspace overlay is open.
- **FR-009**: The system MUST preserve existing keyboard and proximity interaction paths.
- **FR-010**: Focused tests MUST cover pointer drag intent, camera panning, city building clicks, office object clicks, drag suppression, and overlay pointer suppression.

### Key Entities

- **Navigation Intent**: The current operator input summary, including keyboard movement, pointer pan delta, zoom delta, active movement flags, and source classification.
- **Camera Target**: The point the camera follows when avatar-driven navigation is active.
- **Clickable Building**: A company building whose active state and enabled destination allow direct office entry.
- **Clickable Office Object**: An enabled office interactive object whose action can open a workspace or other office interaction.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Operators can pan the visible city or office camera with one drag gesture without moving the Founder.
- **SC-002**: Camera panning remains bounded in 100% of tested city and office drag scenarios.
- **SC-003**: Operators can enter the active company office with one direct building click.
- **SC-004**: Operators can open the project workspace portal with one direct click on a workspace-capable office object.
- **SC-005**: Drag gestures above the click threshold trigger zero direct building or office object actions in focused tests.
- **SC-006**: Blocking overlays suppress 100% of tested stale pointer pan and click interactions while open.

## Assumptions

- This feature extends the existing top-down city and office scenes; it does not introduce new scenes, buildings, office objects, or workspace workflows.
- Pointer support means mouse or pointer-compatible input routed through the existing scene input system.
- Existing keyboard controls remain available for avatar movement and zoom.
- Full ADOS validation is performed outside this handoff runtime.
