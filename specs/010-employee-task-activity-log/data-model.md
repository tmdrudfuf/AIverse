# Data Model: Employee Task Activity Log

TaskActivityType is employee_assigned, status_changed, note_added, or placeholder_action.
TaskActivity contains id, taskId, type, message, createdAt, optional actorId, and optional actorName.
ProjectTask owns optional activityLog because activity is task-scoped and local-only in this phase.