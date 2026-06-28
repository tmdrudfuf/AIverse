# Feature Specification: Employee Work Simulation Placeholder

## User Stories & Testing

### User Story 1 - Start Placeholder Work on Assigned Task (Priority: P1)
As a player managing the Daily Proof workspace, I want an assigned employee to start placeholder work on a task so I can see the planned work loop before real AI execution exists.

**Independent Test**: Assign GPT Engineer to an unassigned task, press Enter/Space on Task Detail, and verify a work-started activity appears.

**Acceptance Scenarios**:
1. Given an unassigned task is open, when Task Detail renders, then Next Action is Assign Employee.
2. Given a task has an assignee, when Task Detail renders, then Next Action is Start Work (placeholder).
3. Given an assigned Todo task is open, when Enter/Space is pressed, then a work_started activity is prepended and the task status becomes In Progress.
4. Given an assigned non-Todo task is open, when Enter/Space is pressed, then a work_started activity is prepended and the existing status is preserved.

## Requirements

### Functional Requirements
- FR-001: The task activity type model MUST include work_started.
- FR-002: Task Detail Enter/Space MUST open employee selection when the task has no assignee.
- FR-003: Task Detail Enter/Space MUST start placeholder work when the task has an assignee.
- FR-004: Starting placeholder work MUST add a local activity message in the format "{employee name} started placeholder work".
- FR-005: Starting placeholder work MUST set Todo tasks to In Progress and MUST NOT complete tasks.
- FR-006: Starting placeholder work MUST preserve employee Working status and MUST NOT trigger real execution.
- FR-007: Activity rendering MUST continue showing the newest entries first.

### Non-Goals
- No OpenAI, Codex CLI, MCP, GitHub automation, networking, timers, save/load, notifications, React, task completion, or progress percentage.

## Success Criteria
- SC-001: An assigned task records visible placeholder work activity from Task Detail.
- SC-002: Todo tasks show In Progress in Task List after placeholder work starts.
- SC-003: Employee assignment and status behavior from Phase 17 remains intact.