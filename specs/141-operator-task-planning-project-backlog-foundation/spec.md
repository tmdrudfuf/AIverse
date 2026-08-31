# Feature Specification: Operator Task Planning Project Backlog Foundation

**Feature Branch**: `codex/141-operator-task-planning-project-backlog-foundation`

**Created**: 2026-08-31

**Status**: Draft

**Input**: User description: "Add a project-scoped task planning and backlog layer to AIverse so an operator can create, organize, inspect, edit, and select planned development tasks for each real registered project without automatically starting ADOS or creating development requests."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create Project Backlog Tasks (Priority: P1)

An operator enters a real project company office, opens planning/backlog, sees the canonical target project, and creates a task by explicitly entering a title and description.

**Why this priority**: Independent project-scoped task creation is the foundation for every later planning workflow.

**Independent Test**: Create two tasks in Project A and one different task in Project B, then verify each stored task carries its canonical project id and appears only in its owning backlog.

**Acceptance Scenarios**:

1. **Given** a registered Project A with a bound company office, **When** the operator opens the planning surface and submits a task title and description, **Then** the task is stored under Project A with a stable id, title, description, planning status, priority, created timestamp, and updated timestamp.
2. **Given** Project A and Project B both have company offices, **When** the operator creates tasks in each office, **Then** Project A never shows Project B tasks and Project B never shows Project A tasks.

---

### User Story 2 - Edit Planning State Safely (Priority: P2)

An operator modifies the selected planned task's title, description, priority, status, and blocked reason while every mutation remains scoped to the task's canonical project.

**Why this priority**: Backlog tasks are long-lived planning artifacts and must remain operator-editable without leaking across stale project selection.

**Independent Test**: Edit a Project A task, switch to Project B, attempt a stale Project A mutation from Project B context, and verify the stale mutation is rejected and Project B is unchanged.

**Acceptance Scenarios**:

1. **Given** a Project A task exists, **When** the operator edits its planning status to Ready, **Then** the status persists and no ADOS run or development request is created.
2. **Given** a Project A task is selected, **When** the operator switches to Project B, **Then** Project A's selected task cannot be edited from Project B.

---

### User Story 3 - Review Deterministic Backlog Order (Priority: P3)

An operator reviews a deterministic backlog order that surfaces ready and blocked work before lower-priority backlog items while leaving priority choices under human control.

**Why this priority**: Operators need a stable "what should this project work on next" view without autonomous prioritization.

**Independent Test**: Create tasks with mixed statuses, priorities, and timestamps, then verify the order is deterministic across reload and not AI-generated.

**Acceptance Scenarios**:

1. **Given** tasks with Ready, Blocked, and Backlog statuses, **When** the backlog is displayed, **Then** Ready and Blocked tasks sort before normal backlog work, followed by priority and timestamp tie-breakers.
2. **Given** task priorities are manually set, **When** the backlog is displayed repeatedly, **Then** priorities are not changed by the system.

---

### User Story 4 - See Portfolio Backlog Indicators (Priority: P4)

An operator viewing the city sees concise, read-only backlog indicators per project company without exposing the full backlog in the city.

**Why this priority**: Portfolio awareness helps triage city companies while preserving the office as the planning surface.

**Independent Test**: Populate Project A and Project B with different backlog states and verify city summaries report each project's own ready/blocked/task counts without mutating tasks.

**Acceptance Scenarios**:

1. **Given** Project A has ready tasks and Project B has blocked tasks, **When** the city portfolio summaries are derived, **Then** each building reports only its project-scoped backlog indicator.
2. **Given** a project is unavailable or no longer registered, **When** a city summary is derived, **Then** the summary surfaces a disconnected/unavailable state and mutations remain disabled.

### Edge Cases

- Missing or unavailable project identity disables backlog mutation and never falls back to another project.
- A task id submitted with the wrong project id is rejected.
- Browser reload preserves tasks, statuses, priorities, blocked reasons, and project ownership.
- Removed projects preserve stored backlog data safely but are surfaced as unavailable and fail closed for mutation.
- Ready, Blocked, and Completed are planning statuses only and never imply ADOS execution, failure, code merge, or development request creation.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST key every backlog collection by the canonical registered project id resolved through the existing project registry and project/company binding.
- **FR-002**: System MUST NOT use global latest project state, display-name guessing, or fallback to another project for backlog reads or mutations.
- **FR-003**: System MUST provide a project-neutral backlog task model with stable task id, canonical project id, title, full description, planning status, priority, created timestamp, and updated timestamp.
- **FR-004**: Operators MUST be able to create tasks from a runtime input surface by entering at least a title and description and taking an explicit create action.
- **FR-005**: System MUST preserve operator-entered title and description text faithfully and MUST NOT create placeholder task text automatically.
- **FR-006**: Operators MUST be able to edit title, description, priority, planning status, and blocked reason when the task belongs to the currently resolved project.
- **FR-007**: System MUST reject stale project/task combinations and missing project mutations without shell, ADOS, Codex, Claude, Git, or GitHub side effects.
- **FR-008**: System MUST persist backlog data across browser reload while validating project ids against the current registry.
- **FR-009**: System MUST maintain Ready, Blocked, Completed, Cancelled, In Progress, and Backlog as planning-only statuses distinct from ADOS runtime statuses and development request lifecycle statuses.
- **FR-010**: System MUST NOT automatically generate tasks, reprioritize tasks, create development requests, start ADOS, start agents, or execute Ready tasks.
- **FR-011**: System MUST provide deterministic ordering by attention status, priority, and timestamp/id tie-breakers.
- **FR-012**: System MUST expose a concise read-only city/portfolio backlog indicator per project without showing the full backlog in the city.

### Key Entities

- **Project Backlog Collection**: The task collection owned by one canonical registered project id.
- **Backlog Task**: A project-neutral planning artifact with operator-entered title/description, planning status, priority, timestamps, optional blocked reason, and optional future association ids.
- **Backlog Summary**: Read-only project-scoped counts used by portfolio/city status surfaces.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An operator can create a backlog task for a registered project in under 2 minutes from the office planning surface.
- **SC-002**: Project switching A -> B -> A restores the exact task collections for each project with zero cross-project task leakage.
- **SC-003**: Browser reload preserves 100% of created task titles, descriptions, priorities, statuses, and owning project ids in deterministic tests.
- **SC-004**: Marking a task Ready causes zero ADOS runs, agent starts, repository mutations, or development request creations.
- **SC-005**: Missing or stale project/task mutation attempts fail closed in deterministic tests.

## Assumptions

- The existing operator is the only actor for this Spec.
- The planning surface should live in the existing office project portal rather than redesigning the office.
- Local browser session persistence remains the persistence mechanism for this feature.
- Later Specs may convert Ready tasks into development requests, but this Spec only records optional association fields.
