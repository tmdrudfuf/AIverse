# Feature Specification: Employee Task Activity Log

## User Story
As a Founder reviewing a Daily Proof task, I can see recent local activity for that task so employee assignments and future AI work events have a visible event trail.

## Acceptance Criteria
- ProjectTask supports a local activityLog containing task activity entries.
- Task activity supports employee_assigned, status_changed, note_added, and placeholder_action types.
- Assigning an employee adds an employee_assigned activity to the selected task.
- Activity message for assignment is "{employee.name} assigned to task".
- New assignment activity appears before older activity entries.
- Task Detail shows an Activity section with the latest three entries or "No activity yet." when empty.
- Activity is local portal task state only.
- No real AI execution, GitHub automation, networking, save/load, notifications, Firebase, MCP, Codex CLI, OpenAI API, or React is added.