# Feature Specification: AI Employee Foundation

## User Story
As a Founder reviewing a Daily Proof task, I can choose a placeholder AI employee and assign them to the task so future execution, scheduling, notifications, and automation have a stable employee boundary.

## Acceptance Criteria
- Task Detail Enter/Space opens an employee-selection view instead of only recording a placeholder action.
- Employee-selection lists GPT Engineer, GPT QA, GPT Designer, and GPT CTO with role and status.
- Up/Down changes the selected employee; Enter/Space assigns the selected employee to the selected task.
- Assignment updates only local portal state so Task Detail shows the selected employee as Assigned.
- Esc returns employee-selection to task-detail, then existing task-list, workspace, project detail, project list, and close behavior continues.
- Employee data is loaded through a provider/service boundary, not directly in Phaser view or scene code.
- Repository and task loading behavior remain unchanged.
- No OpenAI API, MCP, Codex CLI, GitHub automation, Firebase, task execution, networking, React, or save/load is added.