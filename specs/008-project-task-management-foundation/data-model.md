# Data Model: Project Task Management Foundation

TaskPriority is Low, Medium, High, or Critical.
TaskStatus is Todo, In Progress, Review, or Done.
ProjectTask contains id, title, description, status, priority, projectId, optional assignee, optional estimatedHours, createdAt, and updatedAt.
TaskCollection contains projectId and tasks.
Task collections are cached by project id in ProjectPortalState.