# Data Model: Project Dashboard Task Board Entry Action

## Project Dashboard Active Work Selection

Represents which visible Active Work row is selected in the Project Dashboard.

**Fields**:

- `selectedProjectDashboardActiveWorkIndex`: zero-based row index.

**Validation Rules**:

- Must clamp to `0` when no selectable Active Work row exists.
- Must clamp within the visible Active Work row count when dashboard data changes.
- Must not imply task mutation or project mutation.

## Active Work Entry Target

Represents the loaded task corresponding to the selected Active Work summary.

**Fields**:

- `projectId`: selected dashboard project id.
- `taskId`: selected Active Work summary id.
- `taskIndex`: index of the matching task in the loaded task collection.

**Validation Rules**:

- `projectId` must match the selected Project Dashboard project.
- `taskId` must match an existing task in the loaded task collection.
- If no match exists, no navigation occurs.

## Task Detail Navigation State

Existing portal state used to open task detail.

**Fields**:

- `selectedTaskProjectId`
- `selectedTaskIndex`
- `selectedTaskId`
- `viewMode`

**State Transition**:

- `project-dashboard` -> `task-detail` when a selected Active Work target resolves.
- `task-detail` -> `task-list` on Esc, using existing behavior.
