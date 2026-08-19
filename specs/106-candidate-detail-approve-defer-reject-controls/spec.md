# Feature Specification: Candidate Detail Approve Defer Reject Controls

**Feature Branch**: `codex/106-candidate-detail-approve-defer-reject-controls`

**Created**: 2026-08-18

**Status**: Draft

**Input**: User description: "Candidate Detail Approve Defer Reject Controls"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Decide from Candidate Detail (Priority: P1)

As the player reviewing a candidate task detail screen, I can approve, defer, or reject that candidate without returning to the Project Dashboard first.

**Why this priority**: Candidate detail is where the player reads the most context; decision controls there remove an unnecessary back-and-forth while preserving the existing review model.

**Independent Test**: Open candidate detail for a selected Project Dashboard candidate, press each explicit decision action in a valid state, and verify the candidate's promotion status changes for that same candidate.

**Acceptance Scenarios**:

1. **Given** candidate detail is open for an approvable pending candidate, **When** the player presses Approve, **Then** the candidate promotion decision is recorded as Approved and the player remains on that candidate detail.
2. **Given** candidate detail is open for a candidate with a valid defer transition, **When** the player presses Defer, **Then** the candidate promotion decision is recorded as Deferred for that same candidate.
3. **Given** candidate detail is open for a candidate with a valid reject transition, **When** the player presses Reject, **Then** the candidate promotion decision is recorded as Rejected for that same candidate.

---

### User Story 2 - Preserve Dashboard Progression Controls (Priority: P2)

As the player, I can still use the established Project Dashboard controls for promotion and execution pipeline progression.

**Why this priority**: Detail-level decisions must not change the meaning of Enter, Space, or dashboard runtime controls that already drive the candidate pipeline.

**Independent Test**: Use dashboard Enter and Space with candidate detail available, and verify Enter still approves or progresses while Space still cycles status on the dashboard.

**Acceptance Scenarios**:

1. **Given** the Project Dashboard has a selected candidate, **When** the player presses Enter, **Then** the existing dashboard progression behavior remains unchanged.
2. **Given** the Project Dashboard has a selected candidate, **When** the player presses Space, **Then** the existing dashboard status cycle remains unchanged.
3. **Given** candidate detail is open, **When** the player presses Esc, **Then** the player returns to the Project Dashboard with the existing selected candidate context preserved.

---

### User Story 3 - Fail Closed for Invalid Detail Decisions (Priority: P3)

As the player, invalid or stale candidate detail decisions should do nothing rather than changing the wrong candidate or creating active work.

**Why this priority**: Candidate lists can refresh independently; a detail action must never mutate unrelated records or bypass promotion eligibility.

**Independent Test**: Open candidate detail with stale or ineligible promotion context, press decision controls, and verify no unrelated decision, task, employee, runtime, repository, or GitHub state changes.

**Acceptance Scenarios**:

1. **Given** candidate detail is open but the selected candidate no longer has a matching promotion review, **When** the player presses a decision control, **Then** no decision is recorded.
2. **Given** candidate detail is open for a candidate where Approve is unavailable, **When** the player presses Approve, **Then** the existing promotion status remains unchanged.

### Edge Cases

- Candidate detail is open for a candidate with no promotion review collection.
- Candidate detail is open after the candidate task collection refreshes and removes the selected candidate.
- A candidate is already Approved, Deferred, or Rejected and only some transitions are available.
- A decision is recorded from detail while candidate assignment, promoted task, and work session state already exist.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Candidate detail MUST expose distinct Approve, Defer, and Reject actions when candidate detail is open.
- **FR-002**: Candidate detail decision actions MUST record decisions through the existing candidate promotion decision rules for the selected candidate only.
- **FR-003**: Candidate detail MUST remain open after a successful decision and immediately display the refreshed promotion status for the selected candidate.
- **FR-004**: Candidate detail decision actions MUST reject unavailable transitions without recording a decision or mutating unrelated state.
- **FR-005**: Candidate detail decision actions MUST NOT create ProjectTasks, assign employees, prepare or start work sessions, start agent runtimes, mutate repositories, mutate GitHub, publish, merge, or deploy.
- **FR-006**: Existing Project Dashboard Enter, Space, and candidate detail navigation behavior MUST remain unchanged.
- **FR-007**: Esc from candidate detail MUST continue returning to the same Project Dashboard context.
- **FR-008**: Candidate detail MUST show enough action guidance for a player to discover the detail-level Approve, Defer, and Reject controls.

### Key Entities

- **Candidate Detail Decision Action**: A player input from the candidate detail view targeting Approve, Defer, or Reject.
- **Candidate Promotion Decision**: The existing recorded human decision for a candidate task.
- **Selected Candidate Detail Context**: The current project and candidate task identity being inspected.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A player can approve an approvable candidate from candidate detail with one explicit decision action.
- **SC-002**: A player can defer or reject a candidate from candidate detail with one explicit decision action when that transition is available.
- **SC-003**: Detail-level decisions update the visible promotion status before the player leaves candidate detail.
- **SC-004**: Dashboard Enter and Space candidate controls remain behaviorally unchanged after the feature.
- **SC-005**: Stale, unavailable, or ineligible detail decisions create no unrelated project, task, employee, runtime, repository, or GitHub state changes.

## Assumptions

- Approve, Defer, and Reject reuse the existing candidate promotion decision rules and records.
- The detail controls are local in-memory gameplay decisions only.
- Keyboard mappings must remain distinct from existing dashboard, runtime, review, and promotion workflow keys.
