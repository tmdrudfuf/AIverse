# Feature Specification: Employee Knowledge System

**Feature Branch**: `027-employee-knowledge-system`

**Created**: 2026-07-03

**Status**: Draft

**Input**: User description: "Allow the player to understand nearby employees by exposing the reasoning behind their autonomous behavior. This feature extends the Employee Insight System without replacing it. Design the feature around Observe -> Understand -> Influence. Expose existing simulation data rather than creating presentation-only state. The knowledge panel should be capable of showing name, role, current AI state, current task, current project, work progress, mood, thinking, why, current goal, today's schedule, recent activity timeline, planned next activity, and AI confidence if available. Reuse existing Employee AI, Schedule, Project, Conversation, Progression, and Insight systems. Never duplicate simulation state. Automatically update as simulation changes. Keep the first vertical slice lightweight. Design for future dialogue, memory, relationships, and management systems."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Understand Nearby Employee Reasoning (Priority: P1)

As a player near an employee, I want to see why the employee is currently acting that way so that I can understand the autonomous simulation without interrupting work.

**Why this priority**: The feature's core value is moving from passive observation to understanding. The first vertical slice must explain existing behavior rather than add interaction.

**Independent Test**: Enter the office, move near one employee with available insight data, and confirm a read-only knowledge panel updates automatically with identity, state, current work, thinking, why, and current goal while movement remains available.

**Acceptance Scenarios**:

1. **Given** the player is within knowledge range of one employee, **When** the Employee Insight card is eligible to appear, **Then** an Employee Knowledge panel can show read-only information for that same employee.
2. **Given** the employee has current AI, task, project, schedule, and progression context, **When** the panel is visible, **Then** it explains the employee's current behavior using derived "Why" and "Current Goal" summaries from existing simulation data.
3. **Given** the employee's simulation state changes while the player remains nearby, **When** the office simulation updates, **Then** the panel reflects the latest available state without requiring player input.

---

### User Story 2 - Review Schedule and Next Activity (Priority: P2)

As a player observing an employee, I want to understand the employee's current schedule block and planned next activity so that their movement and work choices feel predictable.

**Why this priority**: Schedule context deepens understanding while staying in the Observe -> Understand stage. It also supports future influence features without introducing management controls yet.

**Independent Test**: Observe an employee during a scheduled work or break block and confirm the panel describes today's schedule context and the planned next activity when schedule data is available.

**Acceptance Scenarios**:

1. **Given** an employee has a current schedule snapshot, **When** the knowledge panel is visible, **Then** it can show the current schedule context and planned next activity.
2. **Given** schedule data is partially unavailable, **When** the panel is visible, **Then** schedule rows use stable unavailable or omitted states without inventing schedule data.
3. **Given** the employee transitions from one schedule block to another, **When** the simulation updates, **Then** the panel updates its schedule and next activity explanation.

---

### User Story 3 - Review Recent Activity Timeline (Priority: P2)

As a player observing an employee, I want to see a short recent activity timeline so that I can understand how the employee reached the current state.

**Why this priority**: A lightweight timeline makes autonomous work legible without dialogue, memory, or direct control systems.

**Independent Test**: Observe an employee with recent task or schedule activity and confirm the panel shows a short, read-only timeline derived from existing activity sources.

**Acceptance Scenarios**:

1. **Given** recent task, work session, schedule, or AI activity is available, **When** the panel is visible, **Then** it can show a concise timeline of recent employee activity.
2. **Given** no recent activity source is available, **When** the panel is visible, **Then** it omits the timeline or shows an explicit unavailable state without creating fake history.
3. **Given** new activity is recorded while the employee remains nearby, **When** the simulation updates, **Then** the timeline reflects the latest derived activity.

---

### User Story 4 - Preserve Future Influence Systems (Priority: P3)

As a product team member, I want the knowledge system to stay read-only and reusable so that future dialogue, memory, relationships, and management systems can build on it without refactoring.

**Why this priority**: Employee Knowledge should bridge Observe and Understand first. Influence systems should be able to consume the same derived context later without Employee Knowledge owning those interactions.

**Independent Test**: Review the planned design and completed behavior to confirm no dialogue flow, relationship state, management command, memory persistence, or duplicated simulation state is introduced.

**Acceptance Scenarios**:

1. **Given** the player observes an employee, **When** the knowledge panel is visible, **Then** it does not start dialogue, show choices, modify relationships, assign work, or control the employee.
2. **Given** future dialogue, memory, relationships, or management systems are added, **When** they need employee context, **Then** Employee Knowledge exposes read-only derived context without owning those future systems.

### Edge Cases

- What happens when Employee Insight has no selected nearby employee? The knowledge panel should remain hidden or empty because it extends Insight selection rather than replacing it.
- What happens when reasoning inputs are incomplete? The panel should prefer clear fallback explanations and omitted sections over invented presentation-only state.
- What happens when the employee is idle, walking, on break, in conversation, or going home? The panel should explain the current autonomous state using existing AI and schedule context.
- What happens when multiple employees are nearby? Knowledge should follow the same selected employee as Employee Insight to avoid conflicting observation targets.
- What happens when the project portal or another blocking overlay is open? Knowledge should not compete with blocking overlays.
- What happens when AI confidence is unavailable? The panel should omit confidence or mark it unavailable without generating a fake score.
- What happens when conversation context exists? Knowledge may acknowledge conversation-derived context only as read-only simulation context and must not start dialogue.
- What happens when schedule or activity changes rapidly? The panel should update predictably without stale fields or flickering content.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST extend the existing Employee Insight observation target instead of introducing a separate nearby-employee selection rule.
- **FR-002**: The system MUST expose a read-only Employee Knowledge panel for the currently observed employee when knowledge data is available.
- **FR-003**: The panel MUST be capable of showing name, role, current AI state, current task, current project, work progress, mood, Thinking, Why, current goal, today's schedule, recent activity timeline, planned next activity, and AI confidence when source data exists.
- **FR-004**: The Why explanation MUST be derived from existing Employee AI, schedule, task, project, conversation, progression, and insight context; it MUST NOT be generated from new provider calls.
- **FR-005**: The current goal MUST summarize the employee's likely active objective from existing task, project, schedule, progression, and AI state data.
- **FR-006**: Today's schedule and planned next activity MUST be derived from existing schedule snapshots or omitted when unavailable.
- **FR-007**: The recent activity timeline MUST be derived from existing task activity, work session, schedule, AI, conversation, or progression data and MUST NOT create a new presentation-only history.
- **FR-008**: The system MUST automatically refresh visible knowledge content as the underlying simulation changes.
- **FR-009**: The system MUST NOT duplicate simulation state for presentation purposes.
- **FR-010**: The system MUST NOT allow the player to directly control employees, assign work, alter schedules, change relationships, or trigger dialogue.
- **FR-011**: The system MUST preserve existing Employee Insight behavior and must not replace the lightweight insight card.
- **FR-012**: The first vertical slice MUST remain lightweight by prioritizing current reasoning, goal, and next activity before broader timeline polish.
- **FR-013**: The system MUST keep knowledge derivation separate from panel rendering so future dialogue, memory, relationships, management, economy, multiplayer, and save/load systems can reuse derived context.
- **FR-014**: The system MUST provide stable unavailable or omitted states for missing mood, schedule, timeline, confidence, task, project, or progress data.
- **FR-015**: The system MUST preserve existing employee AI, schedule, project/task, progression, insight, conversation, movement, and office overlay behavior.

### Key Entities

- **Employee Knowledge Panel**: A non-blocking read-only panel that explains the currently observed employee's autonomous behavior.
- **Observed Employee Knowledge**: The derived knowledge context for the Employee Insight-selected employee.
- **Reasoning Summary**: A concise explanation of why the employee is in the current state, derived from existing simulation data.
- **Current Goal Summary**: A concise statement of what the employee appears to be trying to accomplish next or now.
- **Schedule Summary**: Today's current and next schedule context when available.
- **Recent Activity Timeline**: A short list of recent derived activity events from existing simulation sources.
- **AI Confidence**: Optional confidence information only when already available from source systems.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A player can approach a visible employee and see Employee Knowledge for that employee within 5 seconds in manual validation.
- **SC-002**: The visible panel explains the employee's current behavior with a Why summary and Current Goal for at least one working employee during validation.
- **SC-003**: The panel updates within 1 second of an observable simulation state change in manual validation.
- **SC-004**: The panel shows no dialogue choices, interaction prompt, management command, or direct employee-control affordance in 100% of validation attempts.
- **SC-005**: The knowledge target matches the Employee Insight target in 100% of multi-employee deterministic validation cases.
- **SC-006**: Missing optional fields such as mood, timeline, schedule, or confidence produce stable omitted or unavailable states in 100% of validation attempts.
- **SC-007**: Existing Employee Insight, Employee AI, schedule, project/task progression, conversation, movement, and office overlay behavior remain unchanged after the feature is added.

## Assumptions

- Employee Knowledge is scoped to the existing office view and nearby employee observation loop.
- Employee Insight remains the first lightweight signal; Employee Knowledge is a richer understanding layer for the same observed employee.
- The first vertical slice can show fewer fields than the full capable panel if it includes current reasoning, current goal, and next activity from existing data.
- AI confidence is optional because current Employee AI sources may not expose confidence.
- Reasoning summaries are deterministic local summaries of simulation state, not new AI-generated dialogue.
- Future dialogue, memory, relationships, and management systems are out of scope except for preserving extension boundaries.
