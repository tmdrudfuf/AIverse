# Feature Specification: Project Dashboard Task Board Entry Action

**Feature Branch**: `codex/097-project-dashboard-task-board-entry-action`

**Created**: 2026-08-13

**Status**: Draft

**Input**: User description: "Project Dashboard Task Board Entry Action"

## User Scenarios & Testing

### User Story 1 - Open a Task from Project Dashboard Active Work (Priority: P1)

As the player, I can select a visible Active Work task on the Project Dashboard and open its existing task detail view so I can inspect the task without backing out through the workspace task board.

**Why this priority**: The Project Dashboard already summarizes active work; the minimum useful action is a direct entry into the existing task board detail surface for that work item.

**Independent Test**: Open the Project Dashboard for a project with a loaded active task, select the Active Work row, press Enter or Space, and verify the task detail opens for that same task.

**Acceptance Scenarios**:

1. **Given** the Project Dashboard is open for a project with visible active work, **When** the player presses Up or Down, **Then** the selected Active Work row changes without leaving the Project Dashboard.
2. **Given** a visible Active Work row is selected, **When** the player presses Enter or Space, **Then** the existing task detail view opens for that same task and project.
3. **Given** task detail was opened from the Project Dashboard, **When** the player presses Esc, **Then** the player returns to the existing task list for that project.

---

### User Story 2 - Preserve Dashboard Read-Only Behavior (Priority: P2)

As the player, I can use the Project Dashboard task entry action without the dashboard assigning employees, editing tasks, changing status, creating issues, or starting work.

**Why this priority**: The Project Dashboard remains an observation surface; the entry action should only navigate into an existing detail view.

**Independent Test**: Snapshot project, task, employee, work-session, influence, and progression state before using the entry action, then verify only navigation selection state changes.

**Acceptance Scenarios**:

1. **Given** the Project Dashboard entry action is used, **When** state is compared before and after, **Then** project data, task data, employee data, schedules, work sessions, influence, and progression remain unchanged.
2. **Given** no Active Work task is available, **When** the player presses Enter or Space on the Project Dashboard, **Then** the system does not open an unrelated task or mutate data.
3. **Given** Project Dashboard repository refresh controls exist, **When** the task entry action is available, **Then** it does not create issues, run GitHub mutations, start agent runtimes, or trigger task management actions.

### Edge Cases

- Project Dashboard snapshot is unavailable or the selected project cannot be found.
- Active Work rows exist in the snapshot before the full task collection has loaded.
- A visible Active Work summary references a task that is no longer present in the loaded task collection.
- The selected Active Work index is outside the visible row count after refresh.
- The project has no active tasks.

## Requirements

### Functional Requirements

- **FR-001**: The Project Dashboard MUST maintain a selected Active Work row when active work is available.
- **FR-002**: Up and Down input on the Project Dashboard MUST move selection across visible Active Work rows when at least one selectable row exists.
- **FR-003**: Enter and Space on a selected Active Work row MUST open the existing task detail view for the same project and task.
- **FR-004**: Opening task detail from the Project Dashboard MUST set the existing task project, task index, and selected task identity consistently with the existing task board flow.
- **FR-005**: The entry action MUST NOT assign employees, edit tasks, change task status, create issues, start work sessions, start agent runtimes, or mutate project simulation data.
- **FR-006**: The Project Dashboard view MUST make the selected Active Work row visually distinct and show the relevant input hint when task entry is possible.
- **FR-007**: If no matching loaded task exists for the selected Active Work row, Enter and Space MUST leave the player on the Project Dashboard and preserve data state.

### Non-Goals

- No task creation, editing, deletion, drag/drop, or board column movement.
- No new GitHub, issue, repository, credential, webhook, or network mutation behavior.
- No new employee assignment, work-session start, agent runtime, validation runtime, or review runtime behavior.
- No replacement of the existing task list or task detail screens.

### Key Entities

- **Project Dashboard Active Work Selection**: Navigation state identifying which visible Active Work row is selected.
- **Active Work Entry Target**: The loaded project task that corresponds to the selected Project Dashboard Active Work summary.
- **Task Detail Navigation State**: Existing portal state used by the task list/detail flow to identify project, selected task index, and selected task id.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A player can navigate from a Project Dashboard Active Work row to the matching task detail in one Enter or Space action.
- **SC-002**: Up and Down selection across up to three visible Active Work rows updates the selected row immediately.
- **SC-003**: The entry action changes only portal navigation and selection state; project, task, employee, work-session, influence, and progression data remain unchanged.
- **SC-004**: Existing Project Dashboard open/close behavior and existing task list/detail behavior remain available after the change.

## Assumptions

- The first implementation uses the existing Project Dashboard Active Work list and existing task detail view.
- The dashboard displays up to three active work rows, matching the current UI layout.
- Enter and Space are represented by the existing `enterPressed` and `actionPressed` inputs.
- Missing or stale task references should fail closed by leaving the player on the Project Dashboard.
