# Feature Specification: Fifth Employee Recruiting Action

**Feature Branch**: `codex/098-fifth-employee-recruiting-action`

**Created**: 2026-08-13

**Status**: Draft

**Input**: User description: "Fifth Employee Recruiting Action"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Recruit Fifth Employee (Priority: P1)

As the player managing AIverse from the operating terminal, I want a clear recruiting action that adds the fifth employee to the company so the team can grow beyond the initial four-person roster.

**Why this priority**: The company progression loop already tracks employee count and includes a five-employee milestone. The player needs an explicit action to reach that milestone.

**Independent Test**: Start from the company dashboard with the default four employees available, select the recruiting action, activate it, and verify the roster contains one new fifth employee without changing projects, tasks, work sessions, or repository data.

**Acceptance Scenarios**:

1. **Given** the company has the default four employees, **When** the player activates the fifth-employee recruiting action, **Then** one new available employee is added to the roster.
2. **Given** the fifth employee has already been recruited, **When** the player activates or revisits the recruiting action, **Then** no duplicate fifth employee is created.
3. **Given** company progression uses active employee count, **When** the fifth employee is recruited, **Then** progression calculations see five active employees.

---

### User Story 2 - Show Recruitment Feedback (Priority: P2)

As the player, I want the operating terminal to show whether the fifth employee can be recruited or has already joined so I understand the result of the action.

**Why this priority**: Player feedback prevents confusion when a one-time recruiting action becomes unavailable after completion.

**Independent Test**: Render the operating terminal before and after recruitment and verify the recruiting row changes from available to complete while preserving the existing project list and focus entry.

**Acceptance Scenarios**:

1. **Given** the fifth employee is not present, **When** the operating terminal is displayed, **Then** the recruiting action appears as available.
2. **Given** the fifth employee is present, **When** the operating terminal is displayed, **Then** the recruiting action indicates the fifth employee has joined.

### Edge Cases

- If employees have not been loaded yet, the action first uses the existing employee source before deciding whether a fifth employee can be added.
- If an employee with the fifth employee's identity already exists, the action reports completion and leaves the roster unchanged.
- If the roster has fewer than four employees, the action does not fabricate missing earlier employees beyond the existing roster source.
- Recruiting must not assign the new employee to a task, start work, invoke agent runtimes, mutate repositories, or mutate GitHub state.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST expose a selectable fifth-employee recruiting action from the operating terminal.
- **FR-002**: The system MUST add exactly one deterministic fifth employee when the action is activated from a four-employee roster.
- **FR-003**: The fifth employee MUST start available for future assignment and must not be assigned to any project task during recruitment.
- **FR-004**: The recruiting action MUST be idempotent and must never create duplicate fifth employees.
- **FR-005**: The recruiting action MUST update employee-derived previews and dashboard/progression snapshots after a successful recruit.
- **FR-006**: The recruiting action MUST NOT mutate project definitions, task collections, work sessions, repository mappings, repository summaries, or external systems.
- **FR-007**: The terminal MUST show clear status text for the recruiting action before and after completion.

### Key Entities

- **Recruiting Action**: A one-time player action that can add the fifth employee when the initial team is ready.
- **Fifth Employee**: The deterministic employee record added by the recruiting action, including identity, role, status, capabilities, and provider metadata.
- **Recruiting Result**: The latest action outcome, including whether a recruit was added, already existed, or was blocked.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A player can recruit the fifth employee with one activation after selecting the recruiting row.
- **SC-002**: Repeating the action any number of times leaves the roster at one fifth employee record.
- **SC-003**: The roster count shown by the operating terminal updates from 4 to 5 immediately after successful recruitment.
- **SC-004**: Existing projects, tasks, work sessions, and repository state remain unchanged after recruitment.

## Assumptions

- The existing default employee source provides the first four employees.
- The fifth employee is a deterministic placeholder employee, consistent with the current in-memory employee model.
- Recruitment is local game state only and does not represent a real hiring workflow, payment flow, or external account provisioning.
