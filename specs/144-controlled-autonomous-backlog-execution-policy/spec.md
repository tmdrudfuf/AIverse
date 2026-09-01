# Feature Specification: Controlled Autonomous Backlog Execution Policy

**Feature Branch**: `codex/144-controlled-autonomous-backlog-execution-policy`

**Created**: 2026-09-01

**Status**: Draft

**Input**: User description: "Add a project-scoped controlled autonomy policy that can automatically start eligible Ready backlog tasks only when the operator explicitly enables and configures that behavior. Default behavior remains manual."

## User Scenarios & Testing

### User Story 1 - Explicit Project Autonomy Control (Priority: P1)

An operator can see that autonomy is off for the current project by default, deliberately enable it for that canonical project, choose allowed priorities, and disable or pause it again without affecting active work.

**Why this priority**: The feature is primarily a safety and consent layer. No autonomous behavior is acceptable until explicit per-project control is present.

**Independent Test**: Create two projects, enable autonomy for only Project A with selected priorities, reload the office state, and verify Project A remains enabled while Project B remains off.

**Acceptance Scenarios**:

1. **Given** any registered project with no stored autonomy policy, **When** the operator opens the office or city, **Then** autonomy is off and no Ready task starts automatically.
2. **Given** Project A and Project B, **When** the operator enables autonomy for Project A only, **Then** Project A stores that policy and Project B remains manual-only.
3. **Given** Project A has an active ADOS run, **When** the operator disables autonomy for Project A, **Then** the active run continues and no future automatic start is allowed while disabled.

---

### User Story 2 - Safe Deterministic Automatic Start (Priority: P2)

When autonomy is enabled for a project, the system evaluates Ready backlog tasks deterministically and starts at most one eligible task through the existing Start Development bridge.

**Why this priority**: Controlled autonomy only creates value if it can safely trigger the trusted execution path without duplicates or false task state changes.

**Independent Test**: With Project A autonomy enabled and multiple Ready tasks, run evaluation repeatedly and verify the same highest-priority oldest task is selected once, request/preparation/run association is created once, and the task becomes In Progress only after execution acceptance.

**Acceptance Scenarios**:

1. **Given** Project A has autonomy enabled for high priority tasks and a high Ready task with valid content, **When** policy evaluation runs, **Then** that task starts through the existing Start Development bridge.
2. **Given** multiple eligible Ready tasks, **When** policy evaluation runs, **Then** selection follows priority rank, oldest Ready timestamp, and stable task id.
3. **Given** a repeated evaluation, reload, or duplicate UI event, **When** the task already has a request/preparation/run association, **Then** no duplicate request, preparation, run, or association is created.

---

### User Story 3 - Fail-Closed Waiting and Isolation (Priority: P3)

When a project is unavailable, unbound, disconnected, blocked by an active run, filtered by priority, or has no eligible Ready tasks, automation stops and shows a concise deterministic reason.

**Why this priority**: Operators need clear waiting reasons and strict multi-project isolation to trust the automation boundary.

**Independent Test**: Configure Project A on and Project B off, add Ready tasks to both, simulate disconnected and active-run states, and verify only Project A's eligible task may start while Project B remains Ready and manual.

**Acceptance Scenarios**:

1. **Given** a project has autonomy disabled, missing policy, malformed policy, stale identity, or unavailable binding, **When** evaluation runs, **Then** it fails closed and starts no task.
2. **Given** an active, blocked, timed out, or resumable run exists for a project, **When** policy requires no active run, **Then** no replacement task starts.
3. **Given** Spec 143 suggestions exist, **When** autonomy evaluates tasks, **Then** suggestions are not accepted and no backlog task is created.

### Edge Cases

- Missing, corrupted, or stale policy data must resolve to manual-only behavior.
- Project-scoped state must never fall back to the latest project, selected project, or global policy.
- Non-Ready tasks, empty task titles or descriptions, and cross-project tasks must never auto-start.
- Runtime unavailability or pre-start failure must leave the task Ready and avoid repeated relaunch attempts.
- Policy edits during an active run affect future selection only.
- When no eligible Ready task exists, evaluation stops without generating suggestions, creating tasks, or marking tasks Ready.

## Requirements

### Functional Requirements

- **FR-001**: Every project MUST default to autonomy disabled unless the operator explicitly enables that project's policy.
- **FR-002**: Autonomy policy MUST be scoped to one canonical registered project and MUST NOT use a global fallback policy.
- **FR-003**: Operators MUST be able to enable, disable, and configure allowed auto-run priorities for the current canonical project.
- **FR-004**: The UI MUST show current project identity, enabled/disabled state, allowed priorities, execution limit, active-run blocking, and concise waiting/running reason.
- **FR-005**: Manual Start Development for Ready backlog tasks MUST remain available and use the existing trusted bridge.
- **FR-006**: Automatic starts MUST reuse the existing Ready-task-to-development bridge and MUST NOT duplicate request creation, preparation, execution launch, association, or reload reconnection logic.
- **FR-007**: Before automatic start, the system MUST verify canonical project existence, valid project binding, explicit enablement, same-project task ownership, Ready status, non-empty title and description, no accepted/executing association, active-run policy, concurrency limit, allowed priority, available execution services, and connected project state.
- **FR-008**: Failed eligibility conditions MUST return deterministic reasons and MUST NOT execute.
- **FR-009**: When multiple tasks are eligible, selection MUST be deterministic by priority rank, oldest Ready timestamp, and stable task id.
- **FR-010**: Automatic evaluation MUST be idempotent across duplicate events, reloads, re-entry, completion events, and repeated evaluator calls.
- **FR-011**: Task state MUST change to In Progress only after real execution acceptance or existing bridge reconnection.
- **FR-012**: Failed automatic attempts before acceptance MUST leave tasks Ready and MUST NOT create false In Progress or Completed state.
- **FR-013**: Persisted office state MUST restore enabled state, allowed priorities, limits, waiting reason, and existing task execution associations without implying new consent.
- **FR-014**: Disabling autonomy MUST prevent future automatic starts without terminating active ADOS execution or corrupting associations.
- **FR-015**: Spec 143 AI suggestions MUST remain advisory and MUST NOT be accepted, converted to backlog tasks, marked Ready, or sent to ADOS by this policy.
- **FR-016**: Portfolio summaries MAY show concise read-only autonomy state and reason but MUST NOT mutate project autonomy policy.
- **FR-017**: The system MUST avoid continuous polling, busy loops, rapid recursive execution, or unlimited execution queues.

### Key Entities

- **Project Autonomy Policy**: Per-project operator configuration including project id, enabled state, allowed priorities, maximum concurrent executions, active-run blocking, allowed task statuses, update time, and operator update marker.
- **Autonomy Evaluation Result**: Deterministic decision containing project id, selected task when eligible, execution state, and reason when waiting or blocked.
- **Backlog Task Execution Association**: Existing task/request/preparation/run relationship used to prevent duplicate starts and reconnect after reload.

## Success Criteria

### Measurable Outcomes

- **SC-001**: In a two-project setup, enabling autonomy for one project never changes the other project's policy or task state.
- **SC-002**: Repeating the same policy evaluation at least three times creates no more than one request, one preparation, one execution, and one task/run association for a selected task.
- **SC-003**: All documented waiting conditions produce a stable concise reason without starting execution.
- **SC-004**: Operators can disable autonomy during an active run and verify the run remains associated while no later automatic task starts.
- **SC-005**: Required automated tests cover all required safety cases from autonomy default-off through portfolio read-only summary.

## Assumptions

- Existing project registry, project binding, backlog, browser session, development bridge, ADOS run state, and live visualization services remain authoritative.
- Initial safe concurrency is one autonomous execution per project.
- The initial frequency boundary is event-driven evaluation with no high-frequency polling, daily limit, or cooldown control.
- The real backlog task accepted or edited by the operator is authoritative for title, description, status, and priority.
