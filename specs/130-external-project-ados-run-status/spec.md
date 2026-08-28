# Feature Specification: External Project ADOS Run Status

**Feature Branch**: `codex/130-external-project-ados-run-status`

**Created**: 2026-08-25

**Status**: Draft

**Input**: User description: "External Project ADOS Run Status"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See Current ADOS Run Status (Priority: P1)

An AIverse operator viewing the external project dashboard can see the current ADOS run status after an external project run has been prepared or attempted.

**Why this priority**: The bridge can already record preparation and execution evidence; operators need one stable status row that summarizes where the external ADOS run currently stands.

**Independent Test**: Create the external project draft, configure repository identity, create the development request draft, prepare the ADOS run, attempt bridge execution, and verify a current status row is visible on the dashboard.

**Acceptance Scenarios**:

1. **Given** an external ADOS execution result exists, **When** the Project Dashboard renders, **Then** the system shows one current ADOS run status row with status, stage, reason, branch, worktree, and side-effect boundary.
2. **Given** only an ADOS run preparation exists, **When** the Project Dashboard renders, **Then** the system shows a prepared status rather than implying implementer execution has started.

---

### User Story 2 - Preserve Status Across Session Restore (Priority: P2)

An operator can reload the browser office session and still see the latest external ADOS run status for the external project.

**Why this priority**: The status is only useful if it survives the same browser session continuity path as external project draft, preparation, and execution state.

**Independent Test**: Save and restore browser office session state after an ADOS execution result exists, then verify the status row still reflects the latest result.

**Acceptance Scenarios**:

1. **Given** an external ADOS run status exists, **When** browser office session state is saved and restored, **Then** the status remains attached to the external project.
2. **Given** restored execution and status state disagree, **When** the dashboard renders, **Then** the visible status is derived from the latest execution/result evidence rather than stale display text.

---

### User Story 3 - Keep Status Read-Only and Side-Effect Safe (Priority: P3)

An operator can inspect the run status without starting validation, review, repository mutation, GitHub mutation, publish, merge, deploy, or another implementer run.

**Why this priority**: Status inspection must be an audit surface, not a hidden execution trigger.

**Independent Test**: Render the dashboard with prepared, started, completed, blocked, failed, timed-out, and cancelled status inputs and verify each row states that downstream actions did not start.

**Acceptance Scenarios**:

1. **Given** a blocked or failed ADOS execution result exists, **When** the dashboard renders, **Then** the status row includes the reason code and states no downstream side effects started.
2. **Given** an existing completed execution exists, **When** the dashboard status is inspected repeatedly, **Then** no additional implementer provider invocation is implied by status rendering.

### Edge Cases

- ADOS preparation exists but no execution result exists yet.
- ADOS execution result exists without persisted execution evidence.
- Execution evidence exists without a separate result record.
- Status state restored from browser storage is malformed or incomplete.
- A previous attempt timed out, was cancelled, failed, or was blocked before provider invocation.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST derive a current external ADOS run status from preparation, execution, and execution result state.
- **FR-002**: System MUST distinguish prepared, started, completed, blocked, failed, timed-out, and cancelled status states.
- **FR-003**: System MUST render the current status on the external Project Dashboard when any ADOS run state exists.
- **FR-004**: Status rendering MUST include branch, worktree or preparation context, latest reason code when present, and downstream side-effect boundaries.
- **FR-005**: Browser office session save and restore MUST preserve any persisted status state without losing preparation or execution state.
- **FR-006**: Status inspection MUST NOT start validation, review, repository mutation, GitHub mutation, publish, merge, deploy, or another implementer run.
- **FR-007**: If persisted display status is missing or stale, the dashboard MUST still derive the visible status from the latest ADOS preparation/execution evidence.

### Key Entities

- **External Project ADOS Run Status**: A read-only summary of the current ADOS run stage, source record, latest reason, branch/worktree context, and side-effect boundary.
- **Status Source Evidence**: Existing preparation, execution, and result records used to calculate the visible status.
- **Browser Office Session State**: Existing session continuity storage that preserves external project ADOS status state.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of prepared or attempted external ADOS runs show exactly one current status row on the Project Dashboard.
- **SC-002**: 100% of blocked or failed statuses include at least one reason code.
- **SC-003**: 100% of status rows state that validation, review, repository mutation, GitHub mutation, publish, merge, and deploy were not started by status inspection.
- **SC-004**: Restored browser sessions preserve visible external ADOS run status for the external project.

## Assumptions

- This feature is an inspection and persistence slice only.
- The existing execution bridge remains responsible for starting the implementer provider.
- The dashboard status is derived from local browser/application state and does not query GitHub or external services.
