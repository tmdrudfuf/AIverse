# Feature Specification: AI Task Analysis

## User Stories & Testing

### User Story 1 - Prepare Local AI Analysis for Tasks (Priority: P1)
As a player managing Daily Proof tasks, I want tasks to be prepared for future AI operations with local analysis so the company simulation can later recommend staffing, planning, and execution behavior without changing the current UI yet.

**Independent Test**: Open the task list and select/open tasks; verify task analyses are prepared in local state through the AI service while existing UI and task flows remain unchanged.

**Acceptance Scenarios**:
1. Given project tasks are loaded, when a task becomes selected or available for work, then a deterministic local task analysis is prepared.
2. Given a task analysis is prepared, then it includes difficulty, estimated hours, required skills, priority, and reasoning.
3. Given task analysis preparation runs, then no UI changes, external calls, gameplay changes, or provider-specific controller calls occur.

## Requirements

### Functional Requirements
- FR-001: The system MUST define a TaskAnalysis model with difficulty, estimatedHours, requiredSkills, priority, and reasoning.
- FR-002: AIService MUST expose task analysis functionality through its existing provider abstraction.
- FR-003: MockAIProvider MUST produce deterministic task analysis results without network calls or randomness.
- FR-004: Task analysis MUST be prepared when tasks are loaded or selected for work.
- FR-005: Task analysis MUST be stored in local portal/controller state and MUST NOT be displayed in the UI yet.
- FR-006: Controllers MUST use AIService only and MUST NOT call AI providers directly for analysis.
- FR-007: Existing task assignment, work-session, activity-log, and status progression behavior MUST remain unchanged.

### Non-Goals
- No UI exposure, OpenAI calls, GitHub automation, Codex CLI, MCP, networking, timers, background workers, save/load, React changes, or real task execution.

## Success Criteria
- SC-001: Every loaded or selected task can have a deterministic local analysis stored by task id.
- SC-002: Existing task detail, employee assignment, work-session, and activity-log flows continue to validate.
- SC-003: Future providers can replace the mock provider without changing controller analysis call sites.

## Assumptions
- Task analysis is hidden for Phase 22 and only stored for future phases.
- Local controller state is sufficient until persistence/save-load is introduced.