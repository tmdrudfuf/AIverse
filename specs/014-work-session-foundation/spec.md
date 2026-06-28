# Feature Specification: Work Session Foundation

## User Stories & Testing

### User Story 1 - Create Local Work Session on Start Work (Priority: P1)
As a player managing Daily Proof tasks, I want starting placeholder work to create a local work session so future real AI execution can attach to a stable model.

**Independent Test**: Assign an employee to a Todo task, start work, and verify a running placeholder work session appears in Task Detail.

**Acceptance Scenarios**:
1. Given an assigned Todo task is open, when Start Work is triggered, then a local WorkSession is created for the task and employee.
2. Given a WorkSession is created, then it uses provider placeholder and status running.
3. Given Start Work is triggered, then activity records "{employee name} started placeholder work session".
4. Given the task started work, then status becomes In Progress and later Move to Review / Mark Done behavior remains available.

## Requirements

### Functional Requirements
- FR-001: The system MUST define WorkSessionStatus values queued, running, finished, failed, and cancelled.
- FR-002: The system MUST define WorkSessionProviderKind values placeholder, openai, codex-cli, claude-code, gemini, mcp, and github-actions.
- FR-003: WorkSession MUST be stored separately from ProjectTask.
- FR-004: Starting placeholder work MUST create a local WorkSession through WorkSessionService.
- FR-005: Created placeholder sessions MUST have provider placeholder and status running.
- FR-006: Work sessions MUST be stored by task id, newest first.
- FR-007: Task Detail MUST render the latest work session for the selected task.
- FR-008: The work_started activity MUST link to the created session through activityIds.

### Non-Goals
- No OpenAI, Codex CLI, MCP, GitHub automation, networking, timers, save/load, background workers, React, real execution, cancellation UI, or retry UI.

## Success Criteria
- SC-001: Starting work creates a visible local running placeholder session.
- SC-002: Task status progression remains unchanged after the task reaches In Progress.
- SC-003: Employee status remains Working while work starts.