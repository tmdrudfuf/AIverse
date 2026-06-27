# Feature Specification: Computer Project Portal

**Feature Branch**: `004-computer-project-portal`

**Created**: 2026-06-27

**Status**: Draft

**Input**: User description: "Implement Phase 10: Computer Project Portal."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Open Project Portal From Office Computer (Priority: P1)

As the Founder in the office, I need using the computer to open a lightweight project portal so I can see project placeholders from inside the office.

**Why this priority**: The office computer interaction currently only logs a placeholder; the portal is the first visible surface for future project management.

**Independent Test**: Stand in the computer zone, press Space, and verify a Project Portal overlay opens without changing scenes.

**Acceptance Scenarios**:

1. **Given** the Founder is in the computer interaction zone, **When** Space is pressed, **Then** a Project Portal overlay opens.
2. **Given** the Project Portal opens, **When** it appears, **Then** it shows Daily Proof, Portfolio, AI Lab, and placeholder service statuses.

---

### User Story 2 - Close Portal Without Breaking Office Controls (Priority: P2)

As a player, I need to close the portal with Esc or Space and return to normal office controls.

**Why this priority**: The portal must not trap the player or interfere with existing office movement and exit behavior.

**Independent Test**: Open the portal, close it with Esc, reopen it, close it with Space, then move and exit normally.

**Acceptance Scenarios**:

1. **Given** the portal is open, **When** Esc is pressed, **Then** the portal closes and the office scene remains active.
2. **Given** the portal is open, **When** Space is pressed after the opening frame, **Then** the portal closes.
3. **Given** the portal closes, **When** the player moves or exits, **Then** existing office controls work normally.

---

### User Story 3 - Block Office Controls While Portal Is Open (Priority: P3)

As a player, I need the Founder and camera controls to pause while the portal is open so input does not accidentally move, zoom, interact, or exit in the background.

**Why this priority**: Overlay input must have clear ownership and avoid accidental scene actions.

**Independent Test**: Open the portal and verify movement, zoom, exit, and object interactions are ignored until it closes.

**Acceptance Scenarios**:

1. **Given** the portal is open, **When** movement keys are pressed, **Then** the Founder does not move.
2. **Given** the portal is open, **When** Q or E is pressed, **Then** zoom does not change.
3. **Given** the portal is open, **When** Space is pressed, **Then** it closes the portal rather than triggering exit or another object interaction.

### Edge Cases

- The same Space press that opens the portal must not immediately close it.
- The portal must not start a new Phaser scene.
- Portal data is static placeholder data only.
- No real GitHub, Firebase, analytics, AI agent, NPC, or simulation behavior is added.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The computer interaction MUST open a screen-space Project Portal overlay.
- **FR-002**: The portal MUST show project placeholders for Daily Proof, Portfolio, and AI Lab.
- **FR-003**: The portal MUST show placeholder service statuses for GitHub, Firebase, Analytics, and AI Agents.
- **FR-004**: The portal MUST close with Esc.
- **FR-005**: The portal MUST close with Space after the opening input has been consumed.
- **FR-006**: While the portal is open, office movement, zoom, exit, and object interactions MUST be ignored.
- **FR-007**: Closing the portal MUST restore existing office movement, zoom, exit, and object interaction behavior.
- **FR-008**: Opening the portal MUST NOT change scenes.
- **FR-009**: The portal MUST use placeholder static data only.
- **FR-010**: The feature MUST NOT add selectable rows, real integrations, analytics fetching, AI tasks, NPCs, or company simulation.

### Key Entities

- **Project Portal Project**: Placeholder project row shown in the portal.
- **Project Portal Service Status**: Placeholder integration/service status shown in the portal.
- **Project Portal State**: Open/closed runtime state for the overlay.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A player can open the portal from the computer interaction zone in one Space press.
- **SC-002**: The portal remains open after the same Space press that opened it.
- **SC-003**: A player can close the portal with Esc and with Space in separate validation attempts.
- **SC-004**: Existing office exit, movement, collision, camera follow, and Q/E zoom work when the portal is closed.
- **SC-005**: Type checking, production build, and whitespace validation complete successfully.

## Assumptions

- Phaser overlay is sufficient for Phase 10.
- Project data is static and does not need persistence.
- No project row selection is required yet.
- Future real dashboard work may migrate the overlay to React.