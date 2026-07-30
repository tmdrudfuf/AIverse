# Feature Specification: Human Execution Approval Foundation

**Feature Branch**: `codex/072-human-execution-approval-foundation`
**Created**: 2026-07-30
**Status**: Draft
**Input**: AIverse Spec 072 - Human Execution Approval Foundation

## User Scenarios & Testing

### User Story 1 - Explicitly Approve a Ready Execution Plan (Priority: P1)

A human operator reviews a Ready execution readiness result and records an explicit approval for the exact execution plan context.

**Why this priority**: This is the new product boundary. A Ready result must not be confused with human permission.

**Independent Test**: With a valid execution plan and current Ready readiness evaluation, issue the explicit approval command and verify one immutable approval record is created while execution remains not started.

**Acceptance Scenarios**:

1. **Given** a current Ready readiness result for an execution plan, **When** the human selects Approve Execution, **Then** the system records Human Execution Approval and displays Execution Approved plus Execution Not Started.
2. **Given** only a Ready readiness result, **When** no approval command is issued, **Then** no approval record exists and the dashboard shows that human approval is still required.

---

### User Story 2 - Block Stale or Unsafe Approval (Priority: P1)

A human operator attempts approval after the execution context changes, and the system revalidates the execution plan and readiness before approving.

**Why this priority**: Approval must bind to current state and cannot authorize stale plans.

**Independent Test**: Change task, employee, repository, role, or readiness evidence after a prior Ready result, then issue approval and verify the command is blocked with no approval record.

**Acceptance Scenarios**:

1. **Given** a previously Ready result whose task is now stale, **When** approval is requested, **Then** the system blocks approval and preserves source records.
2. **Given** a readiness result that now evaluates as Blocked or Failed, **When** approval is requested, **Then** no approval record is created.

---

### User Story 3 - Present Approval State Safely (Priority: P2)

A human operator can distinguish readiness, approval, and execution state in the dashboard.

**Why this priority**: The UI must avoid implying agent runtime or repository mutation.

**Independent Test**: Render pre-approval, blocked, failed, approved, and already-approved states and verify safe wording, action guidance, and priority-aware layout.

**Acceptance Scenarios**:

1. **Given** readiness is Ready and no approval exists, **When** the dashboard renders, **Then** it displays Human Approval Required, Execution Not Approved, and Execution Not Started.
2. **Given** approval exists, **When** the dashboard renders, **Then** it displays Human Execution Approval Recorded, Execution Approved, Execution Not Started, and Awaiting Runtime Preflight.

## Requirements

### Functional Requirements

- **FR-001**: The system MUST create an immutable Human Execution Approval record only after explicit human input.
- **FR-002**: The system MUST NOT create approval automatically from a Ready readiness result, dashboard render, navigation input, active task, active session, or elapsed time.
- **FR-003**: Every approval command MUST revalidate the Execution Plan before re-evaluating readiness.
- **FR-004**: Every approval command MUST re-evaluate readiness at command time and require the current result to be Ready.
- **FR-005**: The approval record MUST bind to the exact project, execution plan, readiness, task, assignment, prepared session, active session, employee, repository, roles, validation commands, mutation scope, and rules version represented by the current context.
- **FR-006**: The approval identity MUST be deterministic using project and execution-plan identity and MUST NOT use UUIDs, random values, timestamps, names, or dashboard ordering.
- **FR-007**: Repeated approval for the same valid current context MUST return AlreadyApproved and MUST NOT create a duplicate record.
- **FR-008**: AlreadyApproved MUST be returned only after current plan revalidation, current readiness re-evaluation, and exact context comparison.
- **FR-009**: Stale, blocked, failed, mismatched, unsafe, or malformed contexts MUST produce safe Blocked or Failed results without creating approval.
- **FR-010**: Approval records and result records MUST defensively copy arrays and mutable values exposed to callers.
- **FR-011**: Approval MUST NOT mutate ProjectTask, employee, assignment, prepared-session, active-session, execution-plan, readiness, repository, validation-command, branch, or spec metadata.
- **FR-012**: Approval MUST NOT start execution, invoke Codex, invoke Claude, spawn subprocesses, run validation commands, inspect real local paths, run Git, edit files, create branches, create commits, push, create PRs, or mutate GitHub.
- **FR-013**: The dashboard MUST show Human Execution Approval separately from Execution Readiness and future runtime state.
- **FR-014**: The dashboard MUST pair any Execution Approved wording with Execution Not Started.
- **FR-015**: Approval rows MUST use existing priority-aware overflow behavior and MUST NOT unconditionally hide source, sync, focus, active-session, execution-plan, or readiness rows.
- **FR-016**: Approver identity MUST represent a human actor and MUST NOT identify Codex, Claude, bots, agents, or automation as the approver.

### Key Entities

- **HumanExecutionApproval**: Immutable human decision approving one exact currently valid execution plan context.
- **HumanExecutionApprovalResult**: Immutable command outcome: Approved, AlreadyApproved, Blocked, or Failed.
- **HumanExecutionApprovalCommand**: Provider-neutral local command carrying project, plan, readiness, human actor, and timestamp.

## Edge Cases

- A previously Ready readiness result becomes Blocked before approval.
- An approval already exists but the current execution context changed.
- An approval already exists but role labels, validation commands, or mutation scope changed.
- A Codex, Claude, bot, or automation label is supplied as approver.
- The plan reports any execution or mutation flag as started.
- Readiness reports execution approved or any execution/mutation flag as started.
- Project ownership differs even when raw IDs match.
- Repeated Enter input must not create approval before the prior transition has completed.

## Success Criteria

- **SC-001**: In focused tests, 100% of successful approval paths create exactly one immutable approval record and leave execution flags false.
- **SC-002**: In focused tests, 100% of stale or non-Ready approval attempts are blocked or failed with no approval record.
- **SC-003**: In dashboard tests, Ready alone never displays Execution Approved, while explicit approval always displays Execution Not Started.
- **SC-004**: Full validation passes with the existing test suite, TypeScript checks, build, and diff whitespace checks.

## Assumptions

- The local human actor label is `Local Human`.
- Approval history follows the current latest-record collection pattern and uses deterministic identity to prevent duplicates.
- Runtime preflight and actual agent runtime are deferred to later specifications.
