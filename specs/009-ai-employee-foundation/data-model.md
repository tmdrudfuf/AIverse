# Data Model: AI Employee Foundation

EmployeeRole is Engineer, QA, Designer, or CTO.
EmployeeStatus is Idle, Working, or Offline.
Employee contains id, name, role, status, avatarColor, optional assignedTaskId, optional currentProjectId, capabilities, description, optional provider, and optional schedule.
ProjectTask keeps display assignee and adds optional assigneeId for stable employee references.
Portal state stores employees, selectedEmployeeIndex, and employeeAssignments keyed by task id.