# Feature Specification: Employee Insight System

**Feature Branch**: `026-employee-insight-system`

**Created**: 2026-07-03

**Status**: Draft

**Input**: User description: "Allow the player to observe nearby employees without interrupting their work. When the player enters a configurable proximity radius around an employee NPC, automatically display a lightweight Employee Insight card. The card should display employee name, role, current AI state, current task, work progress, project, mood if available, and one short Thinking sentence representing what the employee is currently focused on. Requirements: no dialogue, no interaction key, non-blocking overlay, automatically appears/disappears based on distance, reuse existing Employee AI, schedule, project, and progression systems, designed so a dialogue system can be added later without refactoring."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Observe Nearby Employee Work (Priority: P1)

As a player walking through the office, I want to see a lightweight insight card when I am near an employee so that I can understand what they are working on without opening a menu or interrupting them.

**Why this priority**: The core value is passive observation. The player should learn about employee work state through proximity alone.

**Independent Test**: Enter the office, move near one visible employee, and confirm an insight card appears automatically with employee work information while movement remains available.

**Acceptance Scenarios**:

1. **Given** the player is outside the employee insight radius, **When** the player moves into the radius around one employee, **Then** an Employee Insight card appears automatically.
2. **Given** an Employee Insight card is visible, **When** the player continues moving, **Then** the card does not block movement, office controls, or existing overlays.
3. **Given** an employee has available work context, **When** the card appears, **Then** it shows employee name, role, current AI state, current task, work progress, project, mood if available, and one short Thinking sentence.

---

### User Story 2 - Hide Insight When Leaving Proximity (Priority: P1)

As a player moving away from an employee, I want the insight card to disappear automatically so that the office view stays clean and does not require manual dismissal.

**Why this priority**: Automatic disappearance is part of the non-blocking promise and prevents passive observation from becoming clutter.

**Independent Test**: Move near an employee until the card appears, then move outside the configured radius and confirm the card hides without pressing a key.

**Acceptance Scenarios**:

1. **Given** the Employee Insight card is visible for a nearby employee, **When** the player exits the proximity radius, **Then** the card disappears automatically.
2. **Given** the card disappears, **When** the player re-enters the radius, **Then** the card can appear again with current information.
3. **Given** no employee is within the configured radius, **When** the office updates, **Then** no insight card is visible.

---

### User Story 3 - Choose the Correct Nearby Employee (Priority: P2)

As a player standing near multiple employees, I want the card to describe the nearest eligible employee so that the information feels connected to the person I am observing.

**Why this priority**: Multiple employees can share office zones. The system needs predictable selection to avoid confusing cards.

**Independent Test**: Place the player near multiple employees and verify the nearest employee is shown, with deterministic fallback behavior for ties.

**Acceptance Scenarios**:

1. **Given** multiple employees are inside the proximity radius, **When** the player stops near them, **Then** the card describes the nearest employee.
2. **Given** multiple employees are equally near, **When** selection is resolved, **Then** the same employee is selected consistently until distance or eligibility changes.
3. **Given** the nearest selected employee moves or becomes unavailable, **When** another eligible employee is closer, **Then** the card updates to the correct employee without requiring player input.

---

### User Story 4 - Preserve Future Dialogue Extensibility (Priority: P3)

As a product team member, I want Employee Insight to remain separate from dialogue so that a future dialogue system can be added without replacing the observation system.

**Why this priority**: Employee Insight is passive and non-blocking; dialogue is active and interruptive. Keeping them separate protects future development.

**Independent Test**: Review the completed behavior and confirm no dialogue text, interaction key, conversation state, or dialogue-specific selection is required for insight display.

**Acceptance Scenarios**:

1. **Given** the player approaches an employee, **When** the insight card appears, **Then** it does not start dialogue, show dialogue choices, or require an interaction key.
2. **Given** future dialogue may be added, **When** the insight system is reviewed, **Then** it exposes employee observation data without owning dialogue flow.

### Edge Cases

- What happens when employee data is partially unavailable? The card should show stable fallback text for missing task, project, mood, or progress without failing or showing broken placeholders.
- What happens when the player rapidly crosses the radius boundary? The card should appear and disappear predictably without flicker that prevents reading.
- What happens when the project portal or another blocking overlay is open? Employee Insight should not compete with or obscure blocking overlays.
- What happens when Employee AI state changes while the card is visible? The card should refresh to current information without requiring player input.
- What happens when an employee has no current task? The card should make clear that the employee is idle, available, or between tasks.
- What happens when mood is unavailable? The mood row should be omitted or marked unavailable without creating a fake mood.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST automatically detect when the player is within a configurable proximity radius around an eligible employee NPC.
- **FR-002**: The system MUST automatically display one lightweight Employee Insight card when an eligible employee is within the proximity radius.
- **FR-003**: The system MUST automatically hide the Employee Insight card when no eligible employee is within the proximity radius.
- **FR-004**: The Employee Insight card MUST be non-blocking and must not pause or intercept player movement.
- **FR-005**: The Employee Insight card MUST NOT require or introduce an interaction key.
- **FR-006**: The Employee Insight card MUST NOT start dialogue, show dialogue choices, or display employee speech.
- **FR-007**: The card MUST display employee name, role, current AI state, current task, work progress, project, optional mood, and one short Thinking sentence when source data is available.
- **FR-008**: The Thinking sentence MUST describe the employee's current work focus in one short non-dialogue sentence.
- **FR-009**: The system MUST reuse current employee AI, schedule, project, task, and progression information as the source of insight data.
- **FR-010**: The system MUST use deterministic nearest-employee selection when multiple eligible employees are inside the proximity radius.
- **FR-011**: The proximity radius MUST be configurable without changing the feature's user-facing behavior.
- **FR-012**: The system MUST provide stable fallback display values when task, project, progress, or mood data is unavailable.
- **FR-013**: The system MUST avoid showing Employee Insight over blocking office overlays such as project-management screens.
- **FR-014**: The system MUST preserve existing employee movement, schedule, project progression, task progression, and dialogue behavior.
- **FR-015**: The system MUST keep passive insight data separate from future dialogue behavior so dialogue can be added later without replacing the insight system.

### Key Entities

- **Employee Insight Card**: A passive overlay that summarizes one nearby employee's identity, role, AI state, current work, project, progress, mood if known, and Thinking sentence.
- **Observed Employee**: The employee NPC currently selected for insight because they are eligible and nearest to the player within the configured radius.
- **Proximity Radius**: The configurable distance threshold that determines when an employee is eligible to be observed.
- **Employee Work Context**: The combined employee state, task, project, schedule, and progression information used to populate the card.
- **Thinking Sentence**: A short, non-dialogue summary of what the employee is focused on right now.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A player can make an Employee Insight card appear within 5 seconds by moving near a visible employee in the office.
- **SC-002**: The insight card disappears within 1 second after the player leaves the configured proximity radius in 100% of manual validation attempts.
- **SC-003**: The player can continue moving while the insight card is visible in 100% of validation attempts.
- **SC-004**: The card shows all available required fields for at least one working employee during validation.
- **SC-005**: The card displays no dialogue text, dialogue choices, or interaction-key prompt in 100% of validation attempts.
- **SC-006**: When two employees are nearby, the nearest eligible employee is selected consistently in 100% of deterministic validation cases.
- **SC-007**: Existing employee movement, schedule, project/task progression, and dialogue behavior remain unchanged after the feature is added.

## Assumptions

- The first version targets the existing office view where employee NPCs and the player are already visible.
- Only one Employee Insight card is visible at a time.
- Mood is optional because existing employee data may not yet expose a mood value.
- Work progress can be derived from current task status or existing progression data until more granular progress exists.
- The Thinking sentence is generated locally and deterministically from existing state, not from a new AI call.
- Dialogue remains out of scope except for ensuring the insight system does not block future dialogue integration.
