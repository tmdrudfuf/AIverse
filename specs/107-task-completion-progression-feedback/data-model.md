# Data Model: Task Completion Progression Feedback

## Task Completion Progression Feedback

Represents the latest visible feedback produced by a successful task completion.

**Fields**:

- `projectId`: Project containing the completed task.
- `taskId`: Completed task identity.
- `taskTitle`: Completed task title for player-visible context.
- `completedAt`: Timestamp of the Done transition.
- `previousCompanyLevel`: Company level before the task was marked Done.
- `currentCompanyLevel`: Company level after the task was marked Done.
- `levelUp`: Whether completion advanced the company level.
- `message`: Concise player-visible feedback text.
- `milestoneSummary`: Concise summary of the reached level or current progression state.

**Validation Rules**:

- Feedback is created only for a successful transition to Done.
- Feedback must reference the same selected project and task that was completed.
- Feedback must not be created for stale, already Done, or non-Done transitions.

## Company Progression Trigger

Existing entity reused by this feature to represent a newly reached company level.

**Relationship**:

- A task completion may produce zero or more refreshed progression triggers.
- The visible feedback summarizes the refreshed progression state; the existing office reaction and city reward flows consume the trigger list.
