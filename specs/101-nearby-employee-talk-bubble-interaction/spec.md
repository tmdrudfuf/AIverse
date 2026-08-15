# Feature Specification: Nearby Employee Talk Bubble Interaction

**Feature Branch**: `codex/101-nearby-employee-talk-bubble-interaction`

**Created**: 2026-08-14

**Status**: Draft

**Input**: User description: "Nearby Employee Talk Bubble Interaction"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Talk To Nearby Employee (Priority: P1)

As a player walking through the office, I want to press the existing action control while near an employee so that I can see a short speech bubble from that employee without opening a menu.

**Why this priority**: The core value is turning nearby employee observation into a lightweight active interaction while preserving normal office movement.

**Independent Test**: Move near a visible employee, press the action control, and confirm a bounded speech bubble appears for that employee while the office remains navigable.

**Acceptance Scenarios**:

1. **Given** the player is near an employee and no blocking office overlay is open, **When** the player presses the action control, **Then** a speech bubble appears for the nearby employee.
2. **Given** the speech bubble appears, **When** the player continues moving, **Then** movement and existing office controls remain available.
3. **Given** the player is near an employee with work context, **When** the speech bubble appears, **Then** it displays one deterministic employee line derived from current employee state.

---

### User Story 2 - Keep Conversation Display Bounded (Priority: P1)

As a player, I want employee speech bubbles to disappear automatically so that conversation snippets do not clutter the office view.

**Why this priority**: A lightweight interaction must not become persistent UI clutter or require manual dismissal.

**Independent Test**: Trigger a speech bubble and confirm it remains visible long enough to read, then disappears without player input.

**Acceptance Scenarios**:

1. **Given** a speech bubble is visible, **When** its display duration expires, **Then** it hides automatically.
2. **Given** the player triggers another nearby employee while a bubble is visible, **When** the new interaction succeeds, **Then** the visible bubble updates to the new employee and line.
3. **Given** no employee is nearby, **When** the player presses the action control, **Then** no speech bubble appears.

---

### User Story 3 - Respect Existing Office Interactions (Priority: P2)

As a player, I want computer, exit, portal, insight, and knowledge behavior to continue working normally so that employee talk does not interfere with higher-priority office interactions.

**Why this priority**: The office already has action-driven interactions. Employee talk should fit around them instead of changing their established behavior.

**Independent Test**: Stand near existing office interactables and employees, press action, and confirm the existing interactable behavior still takes precedence where applicable.

**Acceptance Scenarios**:

1. **Given** a blocking office overlay is open, **When** action input is handled, **Then** employee talk bubbles are not started behind the overlay.
2. **Given** the player is at the exit, **When** the action control is pressed, **Then** the exit behavior remains unchanged.
3. **Given** the player is at an existing interactive object, **When** the action control is pressed, **Then** that object's existing action remains available and is not replaced by employee talk.

### Edge Cases

- What happens when employee conversation data is partially unavailable? The bubble should not appear if no valid conversation view model can be created.
- What happens when the selected nearby employee moves or leaves proximity after the bubble appears? The visible bubble may finish its short display duration, but new talk attempts should require a currently nearby employee.
- What happens when the player rapidly presses action? The latest successful nearby employee interaction should replace the current bubble content and restart its display duration.
- What happens when multiple employees are nearby? The same deterministic nearest-employee selection used by existing nearby conversation targeting should choose the speaker.
- What happens when another blocking overlay opens while a bubble is visible? The bubble should hide or stop updating so it does not compete with the blocking UI.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow the player to trigger a nearby employee speech bubble using the existing action control.
- **FR-002**: The system MUST only trigger an employee speech bubble when an eligible employee is currently nearby.
- **FR-003**: The system MUST select the nearest eligible employee deterministically when multiple employees are nearby.
- **FR-004**: The speech bubble MUST display one short employee line and identify the speaker.
- **FR-005**: The speech bubble content MUST reuse existing deterministic employee conversation state.
- **FR-006**: The speech bubble MUST hide automatically after a bounded display duration.
- **FR-007**: Re-triggering a valid nearby employee interaction MUST replace the current speech bubble and restart its display duration.
- **FR-008**: The speech bubble MUST NOT block player movement or existing office controls.
- **FR-009**: The system MUST NOT trigger employee speech bubbles while blocking office overlays are open.
- **FR-010**: Existing exit, computer, project portal, Employee Insight, Employee Knowledge, employee movement, schedule, task progression, and work-animation behavior MUST remain unchanged.
- **FR-011**: The feature MUST NOT introduce real AI calls, persistent conversation history, dialogue choices, voice/audio, relationship systems, or multi-turn chat.

### Key Entities

- **Nearby Employee Talk Target**: The employee selected for speech because they are eligible and nearest to the player at interaction time.
- **Employee Speech Bubble**: A temporary office-scene display containing speaker name and one deterministic employee line.
- **Conversation View Model**: Existing read-only employee conversation presentation data used by the bubble.
- **Display Duration**: The bounded time window after which a visible speech bubble hides automatically.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A player can trigger a speech bubble within 5 seconds by moving near a visible employee and pressing the action control.
- **SC-002**: The speech bubble disappears automatically after one short display window in 100% of validation attempts.
- **SC-003**: The player can continue moving while a speech bubble is visible in 100% of validation attempts.
- **SC-004**: Multiple nearby employees resolve to the nearest eligible employee consistently in 100% of deterministic validation cases.
- **SC-005**: Existing exit, computer, portal, insight, knowledge, NPC rendering, movement, schedule, and task progression behavior remain unchanged after the feature is added.

## Assumptions

- The existing action control remains the single active interaction input for the first version.
- The first version shows one speech bubble at a time.
- The existing EmployeeConversationService is the source of dialogue text.
- The feature is scoped to local office-scene display state only and does not persist conversation history.
