# Data Model

## TaskActivityType
- employee_assigned
- work_started
- status_changed
- note_added
- placeholder_action

## work_started Activity
- id: generated local id
- taskId: selected task id
- type: work_started
- message: "{employee name} started placeholder work"
- createdAt: start timestamp
- actorId: resolved employee id or task assigneeId
- actorName: resolved employee name or task assignee

## ProjectTask Updates
- activityLog prepends the work_started event.
- updatedAt uses the same timestamp as the activity.
- status changes from Todo to In Progress only.