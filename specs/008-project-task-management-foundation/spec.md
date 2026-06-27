# Feature Specification: Project Task Management Foundation

## User Story
As a Founder reviewing the Daily Proof workspace, I can open the Tasks section and inspect placeholder project tasks so future GitHub Issues, AI employees, planning, analytics, notifications, and save/load work have a stable task foundation.

## Acceptance Criteria
- Daily Proof Tasks section is enabled and opens a task-list view in the same portal overlay.
- Task-list shows the three deterministic placeholder Daily Proof tasks with title, status, and priority.
- Task-detail shows title, status, priority, description, assignee, estimated hours, and an Assign Employee placeholder action.
- Task data is loaded through a provider/service boundary, not directly in Phaser view or scene code.
- Enter/Space opens task detail from task-list, and Enter/Space in task-detail records only the Assign Employee placeholder action.
- Esc returns task-detail to task-list, task-list to workspace, workspace to project detail, project detail to project list, and project list closes the portal.
- Repository behavior remains unchanged; Firebase, Analytics, and AI Agents remain disabled.
- No GitHub issue sync, Firebase integration, AI employee implementation, task editing, task creation, task deletion, drag/drop, React overlay, token, env var, network call, or real persistence is added.