# Research: Project Dashboard Task Board Entry Action

## Decision: Reuse Existing Task Detail Navigation

**Rationale**: The existing task list and task detail flow already manages `selectedTaskProjectId`, `selectedTaskIndex`, `selectedTaskId`, task analysis preparation, employee recommendation preparation, and Esc behavior. Reusing it keeps the new Project Dashboard action as navigation instead of a second task-management implementation.

**Alternatives considered**:

- Add a new Project Dashboard task detail panel: rejected because it duplicates the existing task detail surface.
- Open the task list first and require a second Enter: rejected because the feature is specifically a dashboard entry action.

## Decision: Store Dashboard Active Work Selection in Portal State

**Rationale**: The view needs stable highlighting, and the controller needs a selected row target across input events and dashboard refreshes. A small numeric state field follows the existing portal selection pattern.

**Alternatives considered**:

- Derive selection from task-list selection: rejected because task-list selection may refer to all tasks, while dashboard Active Work shows only visible active work rows.
- Avoid selection and always open the first active work item: rejected because it prevents choosing among multiple visible tasks.

## Decision: Fail Closed on Missing or Stale Task Targets

**Rationale**: Dashboard snapshots can refresh independently from loaded task collections. If a selected Active Work summary does not match a loaded task, the safest behavior is to remain on the dashboard without mutating data.

**Alternatives considered**:

- Load a fresh task collection on Enter and open after it resolves: rejected for this slice because opening the dashboard already loads tasks and repeated loading increases async navigation complexity.
- Open by task title fallback: rejected because titles are not stable identifiers.
