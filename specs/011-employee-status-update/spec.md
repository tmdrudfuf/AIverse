# Feature Specification: Employee Status Update

## User Story
As a Founder assigning an employee to a Daily Proof task, I can see that employee move from Idle to Working so task ownership and employee availability are visible locally.

## Acceptance Criteria
- Mock employees still start as Idle from the provider.
- Assigning an employee to a task updates that employee status to Working in local portal state.
- Assigned employee receives assignedTaskId and currentProjectId locally.
- Task Detail shows assigned employee status when the employee is loaded, such as Assigned: GPT Engineer (Working).
- Employee Selection continues to show the status column and reflects local runtime statuses.
- Reassigning a task returns the previous employee to Idle only when no other loaded local task is assigned to them.
- Task assignment, activity logging, task-list/task-detail navigation, employee-selection navigation, repository behavior, and portal back/close behavior are preserved.
- No work execution, timers, completion, AI calls, networking, save/load, notifications, Firebase, GitHub automation, MCP, Codex CLI, OpenAI API, or React is added.