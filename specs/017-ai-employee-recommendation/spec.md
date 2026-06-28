# Feature Specification: AI Employee Recommendation

## User Stories & Testing

### User Story 1 - Prepare Local Employee Recommendations (Priority: P1)
As a player managing Daily Proof tasks, I want the AI foundation to prepare employee recommendations for selected tasks so future assignment experiences can suggest suitable employees without changing current manual assignment gameplay.

**Independent Test**: Open Tasks, select tasks, and verify employee recommendations are prepared in hidden local state through AIService while assignment behavior stays manual.

**Acceptance Scenarios**:
1. Given employees and tasks are available, when a task is analyzed or selected, then a deterministic local employee recommendation is prepared.
2. Given a recommendation is prepared, then it includes recommendedEmployeeId, confidence, reasons, and alternativeEmployeeIds.
3. Given a recommendation exists, then no employee is automatically assigned and the existing employee selection flow remains unchanged.

## Requirements

### Functional Requirements
- FR-001: The system MUST define EmployeeRecommendationResult with recommendedEmployeeId, confidence, reasons, and alternativeEmployeeIds.
- FR-002: AIService MUST expose employee recommendation through the existing provider abstraction.
- FR-003: MockAIProvider MUST generate deterministic recommendations without external calls or randomness.
- FR-004: Recommendations MUST be prepared when tasks are analyzed or selected and employees are available.
- FR-005: Recommendations MUST be stored in hidden local portal/controller state and MUST NOT be shown in the UI yet.
- FR-006: Recommendations MUST NOT automatically assign employees or alter assignment gameplay.
- FR-007: Controllers MUST use AIService only and MUST NOT call providers directly.

### Non-Goals
- No UI exposure, automatic assignment, OpenAI calls, GitHub automation, Codex CLI, MCP, networking, timers, background workers, save/load, React changes, or real task execution.

## Success Criteria
- SC-001: Selected tasks can have deterministic local employee recommendations stored by task id.
- SC-002: Existing employee assignment, work-session, and activity-log flows continue unchanged.
- SC-003: Future providers can replace MockAIProvider without changing controller recommendation call sites.

## Assumptions
- Recommendations are hidden in Phase 23 and only prepare data for future UX.
- If no employees are loaded, recommendation preparation can wait until employees become available.