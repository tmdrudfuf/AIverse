# Contract: Task Completion Progression Feedback

## Interaction Contract

### Complete Selected Review Task

**Given**:

- Portal view mode is `task-detail`.
- Selected task exists in the selected task collection.
- Selected task status is `Review`.

**When**:

- Player presses the existing task action key.

**Then**:

- Selected task status becomes `Done`.
- Existing status-change activity is appended.
- Existing employee release behavior remains intact.
- Company progression triggers are evaluated from the pre-completion snapshot to the post-completion snapshot.
- Latest task completion progression feedback is stored for the completed task.
- Task detail renders the feedback while remaining in task detail.

## Negative Contract

- If selected task is stale, not found, already Done, or not in `Review`, no completion progression feedback is stored.
- If the action only moves a task to Review, no completion progression trigger is created.
- The interaction does not start validation, review, agent runtime, repository mutation, GitHub mutation, publishing, merging, or deployment.
