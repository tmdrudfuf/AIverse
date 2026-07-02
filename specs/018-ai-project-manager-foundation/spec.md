# Feature Specification: AI Project Manager Foundation

## User Stories & Testing

### User Story 1 - Prepare Local Project Management Suggestions (Priority: P1)
As a player managing Daily Proof, I want the AI foundation to prepare project-level management suggestions so future company simulation features can reason about project health, risks, and next actions without changing current gameplay yet.

**Independent Test**: Open the project workspace and tasks; verify hidden local project-manager output can be prepared through service boundaries while all existing project/task/employee/work-session flows remain unchanged.

**Acceptance Scenarios**:
1. Given project, task, employee, and activity data are available, when project-manager preparation runs, then a local health summary, risk list, and next-action recommendation are produced.
2. Given project-manager output is prepared, then no UI changes, automatic task changes, or employee assignments occur.
3. Given future real AI providers are added, then controllers continue depending on AIProjectManagerService and AIService rather than providers.

## Requirements

### Functional Requirements
- FR-001: The system MUST define project-level AI result types for ProjectManagementSuggestion, ProjectHealthSummary, ProjectRisk, and NextActionRecommendation.
- FR-002: AIProjectManagerService MUST depend on AIService and MUST NOT depend on AIProvider or MockAIProvider.
- FR-003: AIProjectManagerService MUST support summarizeProjectHealth(project, tasks, employees, activityLogs).
- FR-004: AIProjectManagerService MUST support identifyProjectRisks(project, tasks, employees).
- FR-005: AIProjectManagerService MUST support recommendNextAction(project, tasks, employees).
- FR-006: Project-manager output MUST be prepared/stored in hidden controller or portal state.
- FR-007: Existing gameplay, UI, task status, assignment, work-session, and activity-log behavior MUST remain unchanged.
- FR-008: No external AI, OpenAI, Codex, MCP, GitHub, networking, timers, or background worker calls may be introduced.

### Non-Goals
- No UI exposure, automatic management actions, task mutation, employee assignment, save/load, real provider execution, React changes, or Phaser rendering changes.

## Success Criteria
- SC-001: A project-level suggestion can be stored locally for Daily Proof without visible UI changes.
- SC-002: Validation confirms existing portal, task, employee assignment, work-session, and activity-log flows still compile and build.
- SC-003: Future real AI providers can replace the mock AI provider without changing controller project-manager call sites.

## Assumptions
- Project-manager output is hidden in Phase 24.
- Local runtime state is sufficient until persistence is introduced.