# Contract: Backlog Development Bridge

## Office Preview

When a project backlog task is selected, the office planning surface must expose:

- Canonical project identity for the current office project.
- Source backlog task title, full description or safe display preview, priority, and planning status.
- Whether Start Development is enabled.
- Existing associated execution/request state, if present.

Preview must not create or mutate development requests, ADOS preparations, ADOS executions, repository state, or task planning status.

## Start Development

Start Development is valid only for a selected Ready task whose canonical project is registered, bound, available, and matches the active office project.

On success:

- Create or reconnect a project-scoped Spec 138 development request.
- Preserve source backlog task id and full task content.
- Prepare the existing durable requirements artifact and ADOS run preparation.
- Start trusted ADOS execution through the existing execution service.
- Persist task -> development request -> preparation -> run association.
- Move the planning task to `in_progress` only after execution is accepted or reconnected.

On failure:

- Do not create duplicate requests or runs.
- Preserve task planning state unless a real execution was accepted.
- Surface concise fail-closed state.

## Isolation

All lookups must be by `(projectId, backlogTaskId)` association. A latest project run or another project's run cannot satisfy the selected task.
