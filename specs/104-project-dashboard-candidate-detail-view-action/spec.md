# Feature Specification: Project Dashboard Candidate Detail View Action

**Feature Branch**: `codex/104-project-dashboard-candidate-detail-view-action`

**Created**: 2026-08-15

**Status**: Draft

**Input**: User description: "Project Dashboard Candidate Detail View Action"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Inspect a Candidate from Project Dashboard (Priority: P1)

As the player reviewing the Project Dashboard, I can open a detail view for the selected candidate task so I can inspect issue-derived candidate information without creating executable work.

**Why this priority**: Candidate rows already summarize issue-derived work on the dashboard; the minimum useful action is a read-only drill-in before approval or promotion decisions.

**Independent Test**: Open a Project Dashboard with candidate tasks, select the visible candidate, press the candidate detail action, and verify a candidate detail view opens for that same candidate.

**Acceptance Scenarios**:

1. **Given** the Project Dashboard has a visible selected candidate task, **When** the player presses the candidate detail action, **Then** the candidate detail view opens for that candidate and project.
2. **Given** the candidate detail view is open, **When** the player presses Esc, **Then** the player returns to the same Project Dashboard.
3. **Given** the selected candidate has assignment or promotion review context, **When** the detail view opens, **Then** the detail summarizes that context without changing decisions or creating active work.

---

### User Story 2 - Preserve Existing Candidate Progression Controls (Priority: P2)

As the player, I can still use the existing candidate approval and runtime progression controls from the Project Dashboard after candidate detail inspection is added.

**Why this priority**: Candidate detail must be an inspection action only; it must not block or replace the established promotion pipeline.

**Independent Test**: Open the Project Dashboard, verify Enter still performs the existing selected candidate progression behavior, and verify the detail action only navigates to read-only detail.

**Acceptance Scenarios**:

1. **Given** a selected candidate promotion is approvable, **When** the player presses Enter on the Project Dashboard, **Then** the existing approval/progression behavior remains available.
2. **Given** the player opens and closes candidate detail, **When** the player returns to Project Dashboard, **Then** the selected candidate remains available for existing progression controls.

---

### User Story 3 - Fail Closed for Missing Candidate Data (Priority: P3)

As the player, I should remain on the Project Dashboard if candidate detail cannot resolve the selected candidate task.

**Why this priority**: Candidate data can refresh independently from the dashboard; stale or missing selections must not open unrelated records or mutate state.

**Independent Test**: Provide a stale selected candidate reference, press the candidate detail action, and verify the dashboard remains unchanged.

**Acceptance Scenarios**:

1. **Given** the selected candidate reference no longer exists in loaded candidate tasks, **When** the player presses the candidate detail action, **Then** the system stays on the Project Dashboard.
2. **Given** no candidate task collection is loaded, **When** the player presses the candidate detail action, **Then** no unrelated detail is opened and no project data changes.

### Edge Cases

- Candidate task collection exists but contains zero tasks.
- Candidate promotion selection points outside the current review count after refresh.
- Candidate detail is opened for a candidate that has no assignment recommendation.
- Candidate detail is opened for a candidate that has no promotion review yet.
- Candidate detail is opened after candidate promotion has already created a project task.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Project Dashboard MUST provide a candidate detail action when a selected candidate task is available.
- **FR-002**: Candidate detail MUST show the selected candidate task's title, issue number, state, priority, type, source provider, source repository, labels, assignees, and summary when available.
- **FR-003**: Candidate detail MUST show available assignment recommendation and promotion review context for the same candidate without changing those records.
- **FR-004**: Esc from candidate detail MUST return to the Project Dashboard for the same project.
- **FR-005**: Candidate detail action MUST NOT create project tasks, assign employees, record promotion decisions, start work sessions, start agent runtimes, mutate repositories, mutate GitHub, publish, merge, or deploy.
- **FR-006**: Existing Project Dashboard candidate progression controls MUST remain available through their existing inputs.
- **FR-007**: If the selected candidate cannot be resolved from loaded candidate task data, the action MUST leave the player on the Project Dashboard and preserve data state.
- **FR-008**: Candidate detail MUST be read-only and MUST NOT replace task list or task detail screens for promoted ProjectTasks.

### Key Entities

- **Candidate Detail Selection**: The project and candidate task identity currently being inspected from the Project Dashboard.
- **Candidate Task Detail**: Read-only issue-derived candidate fields shown to the player.
- **Candidate Context Summary**: Assignment, promotion, and promoted-task status related to the selected candidate.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A player can open candidate detail for a visible selected candidate in one candidate detail action.
- **SC-002**: A player can return from candidate detail to Project Dashboard with one Esc action.
- **SC-003**: Candidate detail displays at least five candidate-specific facts for loaded candidate records.
- **SC-004**: Existing Enter-based candidate progression remains available after the feature.
- **SC-005**: Stale or missing candidate references do not open unrelated records or change project, task, employee, assignment, promotion, runtime, repository, or GitHub state.

## Assumptions

- The candidate detail action uses the existing Project Dashboard selected candidate promotion when promotion reviews are available.
- C/detail is the candidate detail action so Enter can continue to drive the existing candidate approval and runtime progression flow and Space can continue cycling promotion decisions.
- The first slice is read-only and in-memory only.
