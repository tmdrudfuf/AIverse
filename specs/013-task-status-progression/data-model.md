# Data Model

No new model is required.

## Existing TaskStatus
- Todo
- In Progress
- Review
- Done

## Existing TaskActivityType Used
- work_started for Start Work placeholder.
- status_changed for Move to Review and Mark Done.

## Status Activity Entries
Move to Review:
- message: "Task moved to review"
- type: status_changed

Mark Done:
- message: "Task marked done"
- type: status_changed

Both activity entries are prepended to ProjectTask.activityLog and share the same timestamp as ProjectTask.updatedAt.