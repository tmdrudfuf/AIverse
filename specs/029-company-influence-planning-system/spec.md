# Feature Specification: Company Influence Planning System

**Feature Branch**: `029-company-influence-planning-system`

**Created**: 2026-07-03

**Status**: Draft

**Input**: User description: "After the Company Dashboard System lets the player observe and understand company health, progression, projects, teams, and risks, add a lightweight influence planning layer that lets the player choose high-level company priorities without directly controlling employees."

## User Scenarios & Testing

### User Story 1 - Select a Company Focus (Priority: P1)

As the player, I can open an influence planning view from the Company Dashboard and select one current company focus so the company has a clear high-level priority without me directly controlling employees.

**Why this priority**: Selecting one focus is the minimum playable vertical slice and establishes the transition from Observe and Understand toward Influence.

**Independent Test**: Open the Company Dashboard, enter the influence planning view, select each available focus option, and verify exactly one focus is active at a time.

**Acceptance Scenarios**:

1. **Given** the player is viewing the Company Dashboard, **When** the influence planning view is opened, **Then** the player sees the available company focus options.
2. **Given** the influence planning view is open, **When** the player selects "Improve delivery speed", **Then** that focus becomes the active company focus.
3. **Given** any focus is already selected, **When** the player selects a different focus, **Then** the active focus changes to the newly selected focus and the prior focus is no longer active.
4. **Given** the player closes and reopens the dashboard during the same app session, **When** the dashboard appears again, **Then** the selected focus is still shown as the active focus.

---

### User Story 2 - See the Active Focus on the Dashboard (Priority: P1)

As the player, I can see the current company focus on the Company Dashboard so I understand the company's selected priority while reviewing company health, projects, teams, and risks.

**Why this priority**: The focus must be surfaced back into the observation hub to be useful and understandable.

**Independent Test**: Select a focus, return to the Company Dashboard, and verify the dashboard clearly displays the active focus and advisory context without adding management actions.

**Acceptance Scenarios**:

1. **Given** no company focus has been selected, **When** the dashboard renders, **Then** it shows a clear neutral or unset focus state.
2. **Given** a focus has been selected, **When** the dashboard renders, **Then** it shows the selected focus as the current company focus.
3. **Given** the dashboard shows the active focus, **When** the player reviews dashboard sections, **Then** no employee assignment, task completion, project control, dialogue, economy, or payroll action is offered.

---

### User Story 3 - Keep Influence Advisory and Local (Priority: P2)

As the player, I can change the current company focus knowing it only affects local advisory summaries, labels, and future-ready metadata in this phase.

**Why this priority**: This protects employee autonomy and keeps the first influence layer small, deterministic, and safe for the existing simulation.

**Independent Test**: Capture employee, project, task, schedule, work-session, and NPC state before and after focus changes and verify only company focus state and advisory display metadata change.

**Acceptance Scenarios**:

1. **Given** employees are working autonomously, **When** the player changes the company focus, **Then** employee AI state, schedule state, NPC movement, current tasks, and work-session progress do not directly change because of the selection.
2. **Given** projects have tasks and progress, **When** the player changes the company focus, **Then** no task is assigned, completed, reordered, or mutated by the focus change.
3. **Given** the focus is selected, **When** dashboard advisory summaries or labels reference it, **Then** the wording reflects the selected focus without claiming direct operational effects.

---

### User Story 4 - Preserve Future Influence Extensibility (Priority: P3)

As a developer, I can extend the influence planning foundation later for dialogue, management, memory, and stronger simulation effects without replacing the dashboard integration.

**Why this priority**: The feature is a foundation-oriented layer and must avoid architectural dead ends while staying lightweight now.

**Independent Test**: Review the influence planning contracts and tasks to confirm future metadata exists but no future system is implemented ahead of the current slice.

**Acceptance Scenarios**:

1. **Given** a future influence system is planned, **When** the current focus model is inspected, **Then** it contains enough stable identity and advisory metadata to support future extension.
2. **Given** future dialogue, memory, economy, multiplayer, or save/load systems are considered, **When** this feature is complete, **Then** none of those systems have been added or required by the current slice.
3. **Given** external providers could later contribute planning recommendations, **When** this feature is complete, **Then** no external AI call, credentials, network connector, or provider integration has been added.

### Edge Cases

- No focus selected yet: dashboard shows a neutral current focus state and the planning view still offers all focus options.
- Selecting the currently active focus again: the active focus remains unchanged and no duplicate or unrelated state changes occur.
- Closing and reopening the dashboard within the same runtime session: the active focus remains available from local app state.
- Reloading the app: the focus may reset unless an existing local persistence pattern already covers the relevant app state.
- No employees or projects exist yet: the player can still select a focus, and dashboard advisory text avoids fabricating operational impact.
- Dashboard source data refreshes while planning view is open: focus selection remains deterministic and source dashboard sections continue to reflect provider data.
- Invalid or unavailable focus identifiers: the system ignores or rejects them without mutating employee, project, task, schedule, work-session, NPC, or external provider state.

## Requirements

### Functional Requirements

- **FR-001**: The player MUST be able to open a Company Influence Planning view from the Company Dashboard.
- **FR-002**: The system MUST offer exactly these initial company focus options: "Improve delivery speed", "Improve quality", "Improve team morale", "Reduce project risk", and "Prepare for company growth".
- **FR-003**: The player MUST be able to select exactly one active company focus from the available options.
- **FR-004**: The Company Dashboard MUST clearly show the active company focus after selection.
- **FR-005**: When no focus is selected, the Company Dashboard MUST show a clear neutral or unset focus state.
- **FR-006**: Focus selection MUST be deterministic and local to the current in-memory app state unless an existing local persistence pattern already applies.
- **FR-007**: Focus selection MAY influence advisory summaries, labels, and future-ready metadata in this phase.
- **FR-008**: Focus selection MUST NOT directly assign employees, change employee AI behavior, change schedules, move NPCs, mutate work sessions, complete work, reorder work, change task status, or change project execution.
- **FR-009**: Focus selection MUST NOT call external AI providers, external connectors, network services, or credential flows.
- **FR-010**: The feature MUST NOT introduce economy, payroll, relationship, quest, multiplayer, save/load, or full management systems.
- **FR-011**: The implementation MUST reuse the existing Company Dashboard, project portal, Employee AI, schedule, project, company progression, office layout, and simulation systems where relevant.
- **FR-012**: The feature MUST expose current focus data in a way that can be consumed by the dashboard without duplicating existing simulation state for presentation purposes.
- **FR-013**: Existing Company Dashboard, project portal, office movement, computer interaction, NPC behavior, work sessions, and project task execution behavior MUST remain unchanged except for the new focus planning affordance.
- **FR-014**: Manual validation MUST verify opening the dashboard, selecting each focus option, seeing the active focus update, closing and reopening the dashboard, and confirming no direct employee or task mutation occurs.

### Non-Goals

- No direct employee control.
- No task assignment.
- No task status mutation.
- No project execution control.
- No employee AI behavior mutation.
- No dialogue system.
- No relationship system.
- No economy or payroll system.
- No external AI or provider integration.
- No persistence beyond current in-memory runtime state unless an existing pattern already covers it.

### Key Entities

- **Company Focus Option**: A selectable high-level company priority with stable identity, player-facing label, description, and advisory metadata.
- **Current Company Focus**: The single active focus selected by the player, or a neutral unset state.
- **Company Influence Plan State**: Local deterministic state that records the current focus for the current app session.
- **Influence Planning View**: The dashboard-accessible view that lists focus options and allows one selection.
- **Dashboard Focus Summary**: Provider-neutral dashboard data that shows the active focus and advisory context.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A player can select any of the five focus options from the Company Dashboard flow in under 30 seconds.
- **SC-002**: The dashboard displays the active focus immediately after selection and after closing and reopening the dashboard during the same app session.
- **SC-003**: Changing focus produces no direct changes to employee AI state, project task status, schedule state, work-session progress, NPC movement, or project execution.
- **SC-004**: The feature adds no external provider calls, credential flows, economy/payroll systems, dialogue systems, or direct employee-control affordances.
- **SC-005**: Existing Company Dashboard, project portal, office movement, and computer interaction validation flows continue to pass after the feature is implemented.

## Assumptions

- The Company Dashboard System branch is the active foundation for this feature.
- In-memory app state is sufficient for the first vertical slice.
- Future persistence, stronger simulation influence, AI-generated planning recommendations, and management controls require separate Spec Kit features.
- Existing dashboard and project portal navigation patterns should determine the exact interaction controls for the planning view.
