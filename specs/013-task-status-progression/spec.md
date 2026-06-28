# Feature Specification: Task Status Progression

## User Stories & Testing

### User Story 1 - Progress a Task Manually (Priority: P1)
As a player managing Daily Proof tasks, I want to move a task through placeholder statuses so the workspace can model the future work lifecycle before real automation exists.

**Independent Test**: Assign an employee to a Todo task, start work, move it to review, mark it done, and verify the task list, task detail, employee status, and activity log update locally.

**Acceptance Scenarios**:
1. Given an unassigned Todo task is open, when Task Detail renders, then Next Action is Assign Employee.
2. Given an assigned Todo task is open, when Enter/Space is pressed, then placeholder work starts and status becomes In Progress.
3. Given an In Progress task is open, when Enter/Space is pressed, then status becomes Review and activity records "Task moved to review".
4. Given a Review task is open, when Enter/Space is pressed, then status becomes Done and activity records "Task marked done".
5. Given a Done task is open, when Enter/Space is pressed, then no state mutation occurs.

## Requirements

### Functional Requirements
- FR-001: Task Detail MUST dispatch Enter/Space based on the selected task's current action.
- FR-002: Todo tasks without assignees MUST keep the Assign Employee flow.
- FR-003: Todo tasks with assignees MUST keep the Start Work placeholder flow and move to In Progress.
- FR-004: In Progress tasks MUST move to Review and prepend a status_changed activity with message "Task moved to review".
- FR-005: Review tasks MUST move to Done and prepend a status_changed activity with message "Task marked done".
- FR-006: Done tasks MUST render Completed and Enter/Space MUST be a no-op.
- FR-007: Assigned employees MUST remain Working through In Progress and Review.
- FR-008: When a task becomes Done, its assigned employee MUST return to Idle if no other loaded local task is assigned to that employee.
- FR-009: Done tasks MUST retain assignee and assigneeId for history.

### Non-Goals
- No AI calls, Codex CLI, MCP, GitHub automation, networking, timers, save/load, React, or real completion verification.

## Success Criteria
- SC-001: A task can progress Todo to In Progress to Review to Done through Task Detail only.
- SC-002: Task List reflects each local status update.
- SC-003: Activity log shows newest status progression events first.
- SC-004: Employee Working/Idle state remains consistent with loaded task assignments.