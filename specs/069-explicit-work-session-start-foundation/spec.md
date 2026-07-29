# Feature Specification: Explicit Work Session Start Foundation

**Feature Branch**: `codex/069-explicit-work-session-start-foundation`

**Created**: 2026-07-28

**Status**: Draft

**Input**: User description: "Spec 069 - Explicit Work Session Start Foundation"

## User Scenarios & Testing

### User Story 1 - Start a Prepared Session (Priority: P1)

A human operator can explicitly start one valid prepared work session for one assigned ProjectTask. The task becomes active work, the employee becomes logically working, and the dashboard shows that the session is active while agent execution and repository mutation remain not started.

**Why this priority**: This is the next controlled transition after preparation. It creates the first active local work-session state without allowing autonomous agent execution.

**Independent Test**: Given a prepared session with matching task, confirmed assignment, and available employee, one explicit start action creates exactly one active session and updates only the intended task and employee logical state.

**Acceptance Scenarios**:

1. **Given** a Todo ProjectTask with a matching confirmed assignment, prepared session, and available employee, **When** the human starts the session, **Then** the system records one active work session, marks the task In Progress where applicable, marks the employee logically Working where applicable, and keeps all execution and mutation flags false.
2. **Given** a previously started prepared session, **When** the human repeats the start action, **Then** the system returns an already-started result only after revalidating current task, assignment, prepared-session, employee, and active-session state.

---

### User Story 2 - Block Unsafe Starts (Priority: P2)

A human operator receives clear blocked feedback when current state no longer supports starting a session, such as stale prepared-session provenance, unavailable employees, mismatched assignees, completed tasks, or conflicting active sessions.

**Why this priority**: The workflow must not create false active work from stale or mismatched local state.

**Independent Test**: Each invalid current-state condition returns a safe result, creates no active session, and leaves task, employee, assignment, and prepared-session records unchanged.

**Acceptance Scenarios**:

1. **Given** a prepared session whose task assignee no longer matches the confirmed assignment, **When** the human attempts to start, **Then** the start is blocked and no task, employee, or session mutation occurs.
2. **Given** an employee already working in another active session, **When** the human attempts to start a prepared session for that employee, **Then** the start is blocked with a conflict state.

---

### User Story 3 - View Active Session State (Priority: P3)

A human operator can see active work-session status in the project dashboard without confusing it with agent execution, repository mutation, or GitHub activity.

**Why this priority**: Operators need visibility into the transition while preserving the product's staged safety model.

**Independent Test**: The dashboard renders active-session rows with bounded text and safe wording while preserving existing issue, task, candidate, assignment, promotion, and preparation row priorities.

**Acceptance Scenarios**:

1. **Given** an active work session exists, **When** the project dashboard is displayed, **Then** it shows the task, employee, active status, work started state, agent execution not started, and no repository mutation.
2. **Given** many lower-priority rows and long session data, **When** the dashboard is rendered, **Then** issue and ProjectTask detail rows remain visible and active-session rows do not overlap adjacent panels.

### Edge Cases

- The selected dashboard project changes between render and input.
- The prepared session exists but points to another project, task, employee, or confirmed assignment.
- A task is unassigned, completed, cancelled, already In Progress, or assigned to a different employee at command time.
- A confirmed assignment is missing, stale, or not human-confirmed.
- A prepared session has any execution or mutation flag already true.
- An employee is missing, Offline, already Working for another task, or already has a running work session.
- An active session already exists for the same prepared session or conflicts with another employee/task pair.
- Repeated start input must not create duplicate sessions, activities, task transitions, or employee transitions.
- One input event must not confirm assignment, prepare a session, and start a session together.
- Same task-like IDs in different projects must not collide.

## Requirements

### Functional Requirements

- **FR-001**: The system MUST require a distinct explicit human action before starting a prepared work session.
- **FR-002**: The system MUST convert at most one valid prepared session into one active work-session state.
- **FR-003**: The system MUST recalculate eligibility at command time using current ProjectTask, confirmed assignment, prepared-session, employee, and active-session state.
- **FR-004**: The system MUST reject stale, missing, malformed, or cross-project prepared-session inputs conservatively.
- **FR-005**: The system MUST reject starts for unassigned, completed, cancelled, or already-started tasks.
- **FR-006**: The system MUST reject starts when the task assignee and prepared-session employee do not match.
- **FR-007**: The system MUST reject starts when the confirmed assignment is missing, stale, not human-confirmed, or mismatched.
- **FR-008**: The system MUST reject starts when the employee is missing, unavailable, already executing, or already in a conflicting active session.
- **FR-009**: The system MUST prevent duplicate active sessions for the same prepared session.
- **FR-010**: The system MUST make repeated start requests idempotent only after command-time revalidation.
- **FR-011**: The system MUST use deterministic active-session and start-result identifiers.
- **FR-012**: The system MUST preserve prepared-session and confirmed-assignment records as immutable historical records.
- **FR-013**: The system MUST update ProjectTask status to the existing active-work state only when a start succeeds.
- **FR-014**: The system MUST preserve ProjectTask title, description, priority, provenance, and assignee identity when starting.
- **FR-015**: The system MUST update employee logical work state only when a start succeeds, without moving the employee.
- **FR-016**: The system MUST keep agent execution, repository mutation, GitHub mutation, subprocess, and provider runtime flags false.
- **FR-017**: The system MUST expose immutable active-session records and start results to the dashboard.
- **FR-018**: The dashboard MUST distinguish active work sessions from agent execution and repository mutation.
- **FR-019**: The dashboard MUST preserve row priority: issue and ProjectTask details before active sessions; active sessions before lower historical preparation rows.
- **FR-020**: The controller MUST not call GitHub, invoke Codex, invoke Claude, spawn subprocesses, create branches, create commits, or mutate repository files.
- **FR-021**: The implementation MUST not add durable persistence, Firebase, browser storage, scheduling, background jobs, or remote mutation.

### Key Entities

- **Prepared Work Session**: Existing immutable record from Spec 068 that declares a task/employee assignment is ready but inactive.
- **Active Work Session**: Local work-session state created by this feature; active and workStarted are true, while execution and mutation flags remain false.
- **Work Session Start Result**: Immutable command result that records whether a start was successful, repeated, blocked, unavailable, conflicted, or failed.
- **ProjectTask**: Existing task record that may transition from Todo to In Progress after a valid start.
- **Employee**: Existing employee record that may become logically Working after a valid start without movement or agent execution.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A valid prepared session can be started with exactly one explicit action and produces exactly one active session.
- **SC-002**: Repeating the same start action 10 times creates no duplicate active sessions, task activities, or employee transitions.
- **SC-003**: 100% of documented stale, conflict, unavailable, and malformed states produce blocked results without partial state changes.
- **SC-004**: The dashboard displays active session state using wording that says agent execution and repository mutation have not started.
- **SC-005**: Existing issue, task, candidate, assignment, promotion, and preparation workflows remain functional under the full repository validation suite.

## Assumptions

- The existing `WorkSession` model is the canonical active-session domain and can be reused with provider-neutral placeholder metadata while no agent execution exists.
- The existing active task status is `In Progress`.
- The existing logical employee work state is `Working`.
- Prepared-session and confirmed-assignment records remain immutable; active state is represented by the new active-session/start layer and derived dashboard rows.
- Movement and physical workstation behavior remain unchanged and are out of scope.
- Durable persistence and remote synchronization are deferred.
