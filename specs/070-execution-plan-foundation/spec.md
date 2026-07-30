# Feature Specification: Execution Plan Foundation

**Feature Branch**: `codex/070-execution-plan-foundation`

**Created**: 2026-07-29

**Status**: Draft

**Input**: User description: "Spec 070 - Execution Plan Foundation"

## User Scenarios & Testing

### User Story 1 - Create an Execution Plan (Priority: P1)

A human operator can explicitly create an immutable execution plan for one active work session. The plan captures the task, employee, repository, branch, worktree, spec, role, validation, and mutation-scope information an AI agent would need later, while execution remains not started.

**Why this priority**: This is the next controlled transition after active work-session start. It records execution context without crossing into readiness validation or runtime execution.

**Independent Test**: Given a valid active work session with matching task, assignment, prepared session, employee, repository metadata, worktree, branch, spec path, and configured implementer/reviewer roles, one explicit plan action creates exactly one immutable execution plan and result.

**Acceptance Scenarios**:

1. **Given** an active work session for a valid ProjectTask and employee, **When** the human creates an execution plan, **Then** the system records one execution plan with deterministic identity and shows execution not started.
2. **Given** an execution plan already exists for the active session, **When** the human repeats the create-plan action, **Then** the system returns an already-existing result only after revalidating current task, session, repository, worktree, branch, spec, and role state.

---

### User Story 2 - Block Invalid Plans (Priority: P2)

A human operator receives explicit blocked feedback when current state is not sufficient to create an execution plan, such as stale active-session provenance, missing repository metadata, missing worktree, missing spec, or missing role configuration.

**Why this priority**: A plan is only useful if it accurately captures current execution context. The workflow must not create misleading plans from stale or incomplete local state.

**Independent Test**: Each invalid current-state condition returns a safe result, creates no plan, and leaves task, employee, assignment, prepared-session, active-session, repository, and GitHub state unchanged.

**Acceptance Scenarios**:

1. **Given** an active session whose task provenance no longer matches the current project, **When** the human attempts to create a plan, **Then** the request is blocked and no plan is created.
2. **Given** repository metadata exists but the worktree or spec path is unavailable, **When** the human attempts to create a plan, **Then** the request is blocked with a safe reason and no product state is mutated.

---

### User Story 3 - View Execution Plan State (Priority: P3)

A human operator can see execution-plan status in the project dashboard without confusing it with execution readiness, agent runtime, subprocess activity, repository mutation, or GitHub activity.

**Why this priority**: Operators need visibility into captured plan context while preserving the staged safety boundary.

**Independent Test**: The dashboard renders execution-plan rows with bounded text and safe wording while preserving existing issue, task, active-session, candidate, assignment, promotion, and preparation row priorities.

**Acceptance Scenarios**:

1. **Given** an execution plan exists, **When** the project dashboard is displayed, **Then** it shows plan created, implementer, reviewer, branch, worktree, spec, validation commands, mutation scope, and execution not started.
2. **Given** long worktree, branch, spec, and validation data, **When** the dashboard is rendered, **Then** existing issue and ProjectTask detail rows remain visible and execution-plan rows do not overlap adjacent panels.

### Edge Cases

- The selected dashboard project changes between render and input.
- The active session exists but belongs to another project, task, employee, prepared session, or confirmed assignment.
- A task, assignment, prepared session, active session, employee, repository identity, repository sync snapshot, worktree, branch, spec, implementer role, or reviewer role is missing.
- A task is no longer In Progress or no longer assigned to the active-session employee.
- An employee is no longer Working for the active-session task.
- Repository metadata is unavailable, stale, or missing the current branch.
- A worktree or spec path does not exist locally.
- Repeated create-plan input must not create duplicate plans or results.
- One input event must not start a session and create an execution plan together.
- Same task-like IDs in different projects must not collide.

## Requirements

### Functional Requirements

- **FR-001**: The system MUST require a distinct explicit human action before creating an execution plan.
- **FR-002**: The system MUST create at most one immutable execution plan for one valid active work session under the current rules version.
- **FR-003**: The system MUST recalculate eligibility at command time using current ProjectTask, confirmed assignment, prepared-session, active-session, employee, repository, worktree, spec, and role state.
- **FR-004**: The system MUST reject missing, stale, malformed, or cross-project active-session inputs conservatively.
- **FR-005**: The system MUST reject plan creation when the ProjectTask is missing, no longer active, or no longer assigned to the active-session employee.
- **FR-006**: The system MUST reject plan creation when the confirmed assignment or prepared session is missing or mismatched.
- **FR-007**: The system MUST reject plan creation when the employee is missing or no longer matches the active session.
- **FR-008**: The system MUST reject plan creation when repository identity, repository sync metadata, current branch, worktree path, or spec path is unavailable.
- **FR-009**: The system MUST reject plan creation when configured Implementer or Reviewer role information is unavailable.
- **FR-010**: The system MUST use deterministic execution-plan and execution-plan-result identifiers.
- **FR-011**: The system MUST keep execution plans immutable; changes in captured context require a new plan identity rather than rewriting an existing plan.
- **FR-012**: The system MUST make repeated plan requests idempotent only after command-time revalidation.
- **FR-013**: The system MUST preserve task, employee, assignment, prepared-session, active-session, repository, and GitHub state unchanged during plan creation.
- **FR-014**: The execution plan MUST include project, feature, task, candidate, recommendation, promotion, assignment, prepared-session, active-session, employee, repository, worktree, branch, spec, role, validation, allowed mutation-scope, timestamp, and rules-version fields.
- **FR-015**: The execution-plan result MUST distinguish Created, AlreadyExists, Blocked, and Failed outcomes.
- **FR-016**: The dashboard MUST distinguish execution plans from readiness, runtime, agent execution, subprocesses, repository mutation, and GitHub mutation.
- **FR-017**: The dashboard MUST preserve row priority so issue, ProjectTask, and active work-session rows remain visible before execution-plan rows.
- **FR-018**: The controller MUST not call GitHub, invoke Codex, invoke Claude, spawn subprocesses, create branches, create commits, or mutate repository files.
- **FR-019**: The implementation MUST not add durable persistence, Firebase, browser storage, scheduling, background jobs, readiness validation, runtime execution, or remote mutation.

### Key Entities

- **Execution Plan**: Immutable local record that captures all context a future AI agent would need to execute an active work session.
- **Execution Plan Result**: Immutable command result that records whether plan creation was created, already existed, blocked, or failed.
- **Active Work Session**: Existing active local session from Spec 069 that supplies the plan's source session identity and provenance.
- **Repository Context**: Existing project repository identity and sync metadata plus local worktree path and branch.
- **Execution Role Context**: Provider-neutral implementer/reviewer role labels and validation commands captured as plan data, not executed.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A valid active work session can produce exactly one execution plan after one explicit human action.
- **SC-002**: Repeating the same plan action 10 times creates no duplicate plans and returns AlreadyExists only after current-state validation.
- **SC-003**: 100% of documented stale, missing, unavailable, and malformed states produce blocked results without partial state changes.
- **SC-004**: The dashboard displays execution plan state using wording that clearly says execution is not started.
- **SC-005**: Existing issue, task, assignment, promotion, preparation, and active-session workflows remain functional under the full repository validation suite.

## Assumptions

- The active `WorkSession` record from Spec 069 is the source of truth for plan eligibility.
- The current local product can use the project repository identity and repository sync snapshot as repository metadata.
- The feature spec path is available from the Spec Kit pointer for the active feature and can be captured as data.
- Default roles remain Implementer = Codex CLI and Reviewer = Claude CLI, but the plan stores provider-neutral role labels and does not execute them.
- Allowed mutation scope is represented as local plan metadata only and does not grant runtime permission.
- Durable persistence, readiness checks, agent runtime, subprocess spawning, repository mutation, and GitHub mutation are deferred.
