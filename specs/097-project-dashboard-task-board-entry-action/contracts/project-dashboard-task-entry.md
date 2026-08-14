# Contract: Project Dashboard Task Entry

## Input Contract

When `ProjectPortalState.viewMode` is `project-dashboard`:

- `upPressed`: selects the previous visible Active Work row when any row is selectable.
- `downPressed`: selects the next visible Active Work row when any row is selectable.
- `enterPressed`: opens task detail for the selected visible Active Work row when the target resolves to a loaded task.
- `actionPressed`: same task-entry behavior as `enterPressed`.
- `escapePressed`: keeps existing Project Dashboard return-to-list behavior.

## State Contract

Successful task entry sets:

- `viewMode = "task-detail"`
- `selectedTaskProjectId = selectedProjectDashboardProjectId`
- `selectedTaskIndex = index of matching loaded task`
- `selectedTaskId = matching task id`

Successful task entry preserves:

- Project records
- Task records
- Employee records
- Work-session records
- Company influence state
- Company progression state
- Repository mappings and issue snapshots, except for existing asynchronous dashboard refresh behavior that is already part of Project Dashboard opening

## View Contract

The Project Dashboard Active Work list:

- Shows a visible selected marker or equivalent highlight for the selected Active Work row.
- Shows an instruction hint for Up/Down selection and Enter/Space opening when at least one Active Work row is available.
- Shows the existing read-only project dashboard information without adding task editing, assignment, issue creation, or runtime-start affordances.
