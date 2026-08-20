# Contract: Reception Desk Upgrade Benefits Interaction

## Workspace Benefit Display

### Input

- Current company progression snapshot.
- Existing workspace view state.

### Behavior

- When company level is at least 2 and reception is unlocked, derive a reception upgrade benefits model.
- Render the model in the workspace surface with:
  - A clear reception upgrade heading.
  - A concise summary.
  - At least three benefit rows.
- When reception is not unlocked, omit the benefit model and render the workspace as before.

### Non-Goals

- Do not start implementer, reviewer, validation, or review-fix runtimes.
- Do not run validation commands.
- Do not mutate repositories or GitHub.
- Do not add persistence.

### Expected Benefit Rows

- Reception area is unlocked.
- Employee capacity increased to the current progression limit.
- Workspace coordination has a clear front-desk entry point.
