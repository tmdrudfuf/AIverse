# Feature Specification: Assigned Task Work Session Preparation Foundation

**Feature Branch**: `codex/068-assigned-task-work-session-preparation-foundation`

**Created**: 2026-07-29

**Status**: Draft

**Input**: User description: "Spec 068 — Assigned Task Work Session Preparation Foundation"

## User Scenarios & Testing

### User Story 1 - Prepare a Confirmed Assignment (Priority: P1)

A human operator can explicitly prepare a work session for a ProjectTask that already has a confirmed employee assignment, while seeing that no work has started.

**Why this priority**: This is the core boundary between confirmed assignment and future execution.

**Independent Test**: Start from one Todo ProjectTask with a matching confirmed assignment and available employee, trigger the preparation action once, and verify exactly one prepared-session record appears with inactive, not-started, no-execution wording.

**Acceptance Scenarios**:

1. **Given** a Todo ProjectTask assigned to the confirmed employee, **When** the human chooses "Prepare work session", **Then** the system records one prepared session and leaves the task Todo, the employee not working, and active work sessions empty.
2. **Given** the same prepared assignment, **When** the human repeats the preparation command, **Then** the system reports already prepared and does not create a duplicate.

---

### User Story 2 - Block Unsafe or Stale Preparation (Priority: P2)

A human operator receives a clear blocked result when the task, confirmed assignment, employee, project, or existing sessions no longer satisfy preparation rules.

**Why this priority**: Preparation must not bypass current eligibility or accidentally start unsafe work.

**Independent Test**: Attempt preparation with stale project data, mismatched assignee, unavailable employee, started task, completed task, or existing active session and verify each case returns a safe non-mutating result.

**Acceptance Scenarios**:

1. **Given** a confirmed assignment whose employee no longer matches the task assignee, **When** preparation is requested, **Then** no prepared session is created and the reason identifies an assignee mismatch.
2. **Given** an employee already in an active work session, **When** preparation is requested, **Then** no prepared session is created and no task or employee state changes.

---

### User Story 3 - Review Preparation State on the Dashboard (Priority: P3)

A human operator can distinguish confirmed assignments from prepared work sessions on the project dashboard without losing higher-priority issue, task, promotion, and assignment rows.

**Why this priority**: Visibility is required for human control, but preparation rows must remain lower priority than existing operational rows.

**Independent Test**: Render realistic dashboard data with multiple preparation results and long text, then verify bounded low-priority rows show safe wording and do not overlap or displace higher-priority rows unexpectedly.

**Acceptance Scenarios**:

1. **Given** one prepared session, **When** the project dashboard renders, **Then** it shows "[WORK SESSION PREPARATION]" with "Prepared", "Not started", "Inactive", and "No agent execution".
2. **Given** a crowded dashboard, **When** lower-priority rows are trimmed, **Then** preparation rows drop before confirmed-assignment rows and issue/detail rows remain visible.

### Edge Cases

- Repeated preparation commands must be idempotent.
- Same-title tasks and same-name employees must remain distinct through stable IDs.
- Same task IDs in different projects must not collide.
- Preparation must be blocked for unassigned, started, completed, project-mismatched, stale, unavailable, or active-session-conflicting inputs.
- Preparation must not be triggered by render, refresh, assignment confirmation, promotion, navigation, or one shared input event.
- Existing work-session records with active statuses must block preparation, but no active work session may be created by this feature.

## Requirements

### Functional Requirements

- **FR-001**: System MUST support an explicit human preparation command for a currently confirmed ProjectTask assignment.
- **FR-002**: System MUST create at most one immutable prepared-session record for one confirmed assignment.
- **FR-003**: Prepared-session identifiers MUST be deterministic from project, ProjectTask, confirmed assignment, and preparation ruleset.
- **FR-004**: Preparation results MUST distinguish Prepared, AlreadyPrepared, Ineligible, Unavailable, Conflict, and Failed outcomes or equivalent safe states.
- **FR-005**: Preparation MUST revalidate task, assignment, employee, project, provenance, and existing active-session state at command time.
- **FR-006**: Preparation MUST leave ProjectTask status Todo or equivalent not-started state.
- **FR-007**: Preparation MUST leave employee state, movement, active work sessions, assignment recommendations, promotion decisions, and confirmed assignment records unchanged.
- **FR-008**: Preparation MUST never invoke Codex, Claude, subprocesses, repository mutation, GitHub mutation, branch creation, commits, or active task execution.
- **FR-009**: Preparation MUST be idempotent and return the same prepared-session identity for repeated commands.
- **FR-010**: Preparation MUST preserve provider-neutral provenance from the confirmed assignment, promoted ProjectTask, recommendation, and promotion decision where available.
- **FR-011**: The dashboard MUST show preparation rows separately from confirmed assignments and active work sessions.
- **FR-012**: Dashboard wording MUST explicitly show prepared sessions are not started, inactive, and have no agent execution.
- **FR-013**: Dashboard rows MUST remain bounded, deterministic, and lower priority than issue, active task, candidate task, assignment, promotion, and confirmed-assignment rows.
- **FR-014**: Controller integration MUST isolate preparation by selected project and prevent stale selected rows from mutating another project.
- **FR-015**: Existing ProjectTasks, confirmed assignments, recommendations, promotion decisions, employee records, movement snapshots, and active work sessions MUST remain unchanged except for adding prepared-session/result records.

### Key Entities

- **Prepared Work Session**: Immutable local record that a confirmed assignment has been prepared for future work, with inactive and not-started flags.
- **Preparation Result**: Immutable outcome of a preparation command, including reason codes and duplicate indicators.
- **Preparation Eligibility**: Deterministic evaluation of whether a confirmed assignment can be prepared now.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A valid confirmed assignment can be prepared with one explicit action and produces exactly one prepared-session record.
- **SC-002**: Repeating the same preparation action 10 times produces no duplicate prepared sessions and reports the same prepared-session identity.
- **SC-003**: Ineligible preparation attempts leave task, employee, confirmed-assignment, and work-session state unchanged in 100% of tested failure cases.
- **SC-004**: Dashboard preparation rows fit within the existing lower panel and never overlap adjacent rows in tested crowded layouts.
- **SC-005**: Full validation passes with existing tests plus focused preparation tests.

## Assumptions

- Prepared-session records are local in-memory state for this feature; durable persistence is deferred.
- The existing active `WorkSession` model remains execution-oriented, so preparation uses a separate record.
- A Todo ProjectTask is the safe not-started state.
- Confirmed assignment records from Spec 067 are immutable historical evidence and are not rewritten by preparation.
- One prepared session per confirmed assignment is the supported invariant for this foundation.
