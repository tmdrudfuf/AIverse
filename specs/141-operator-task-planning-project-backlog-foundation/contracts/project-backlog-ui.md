# Contract: Project Backlog UI

## Office Planning Surface

- Shows the current canonical project and company name before task creation.
- Provides runtime text inputs for task title and task description.
- Provides operator controls for priority and planning status.
- Requires explicit operator action to create or update a task.
- Disables mutation when the project context is missing, unavailable, or does not match the selected task's project id.
- Does not start ADOS, agents, subprocesses, Git, or GitHub operations when a task is created, selected, marked Ready, Blocked, or Completed.

## Portfolio Indicator

- Derives read-only backlog summary counts from the canonical project id for each city building.
- Shows only concise summary text in the city/portfolio layer.
- Does not expose full task details or mutate backlog state.
