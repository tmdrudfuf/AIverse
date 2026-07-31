# Feature Specification: Runtime Start Foundation

**Feature Branch**: `codex/074-runtime-start-foundation`

**Created**: 2026-07-30

**Status**: Draft

**Input**: User description: "Spec 074 adds an explicit Runtime Start product-state foundation after Runtime Preflight. It records a human runtime-start decision without launching Codex, Claude, subprocesses, validation commands, repository mutation, or GitHub mutation."

## User Scenarios & Testing

### User Story 1 - Record Runtime Start (Priority: P1)

A human operator can explicitly record that a currently approved and preflight-passed execution context has entered the runtime-started product state.

**Why this priority**: This is the only new product state introduced by Spec 074 and is required before any later agent runtime feature can safely begin.

**Independent Test**: Build a valid chain through Runtime Preflight, issue one explicit Runtime Start command, and verify one immutable start record with `executionStarted` true and all agent/mutation flags false.

**Acceptance Scenarios**:

1. **Given** a current Ready Runtime Preflight for an approved execution context, **When** the human explicitly starts the approved runtime, **Then** the system records Runtime Start and shows execution started with agents not started.
2. **Given** a Ready Runtime Preflight, **When** the dashboard renders or navigation changes, **Then** Runtime Start is not created.

---

### User Story 2 - Block Stale or Unsafe Starts (Priority: P2)

A human operator receives safe blocked feedback when the execution chain or runtime evidence changed after preflight.

**Why this priority**: Runtime Start must not authorize stale approvals or stale local runtime evidence.

**Independent Test**: Change task, approval, branch, worktree, command, mutation scope, or preflight state after a previous Ready result and verify Runtime Start returns Blocked without source mutation.

**Acceptance Scenarios**:

1. **Given** a previous Ready preflight, **When** current preflight revalidation is Blocked or Failed, **Then** Runtime Start is blocked and no start record is created.
2. **Given** a changed approval, role context, validation command, mutation scope, repository, worktree, branch, spec, or project, **When** Runtime Start is requested, **Then** the result is Blocked or Failed with a deterministic reason.

---

### User Story 3 - Display Runtime Start Safely (Priority: P3)

The Project Dashboard displays Runtime Start state without implying an agent process or repository mutation.

**Why this priority**: The product pipeline is visible in the dashboard and wording must preserve the new state boundary.

**Independent Test**: Render unavailable, blocked, available, and started states and verify priority-aware overflow preserves prior sections.

**Acceptance Scenarios**:

1. **Given** no approval or no preflight, **When** the dashboard renders, **Then** Runtime Start is unavailable and execution remains not started.
2. **Given** a Runtime Start record, **When** the dashboard renders, **Then** it shows Runtime Start Recorded, Execution Started, Agents Not Started, and Awaiting Implementer Start.

### Edge Cases

- Repeated identical start returns AlreadyStarted only after current chain and preflight revalidation.
- Same raw identifiers in another project never cross-resolve.
- A historical start remains immutable but must not be shown as currently valid if upstream state changes.
- Agent, bot, Codex, Claude, or automation actor labels are rejected as runtime-start actors.
- Runtime Start must not run validation commands or spawn any process.

## Requirements

### Functional Requirements

- **FR-001**: System MUST create deterministic Runtime Start IDs using the project and Execution Plan identity.
- **FR-002**: System MUST require explicit human Runtime Start input and never start automatically from approval, preflight, render, initialization, timers, or navigation.
- **FR-003**: System MUST revalidate Execution Plan, Execution Readiness, Human Execution Approval, and Runtime Preflight in order before creating Runtime Start.
- **FR-004**: System MUST require current Runtime Preflight status Ready before Runtime Start.
- **FR-005**: System MUST create immutable Runtime Start and Runtime Start Result records atomically.
- **FR-006**: System MUST set `executionStarted` true only in Runtime Start records/results and keep `agentStarted`, implementer/reviewer started, validation started, repository mutation, and GitHub mutation false.
- **FR-007**: System MUST return AlreadyStarted only after full current revalidation and exact-context comparison.
- **FR-008**: System MUST block stale plans, readiness, approvals, preflights, runtime evidence, role context, validation commands, mutation scope, and project mismatches.
- **FR-009**: System MUST reject non-human runtime-start actors, including Codex, Claude, agent, bot, and automation labels.
- **FR-010**: System MUST not invoke Codex, Claude, subprocesses, validation commands, filesystem mutation, Git mutation, branch changes, commits, pushes, PRs, or GitHub mutation.
- **FR-011**: System MUST expose Project Dashboard Runtime Start rows with safe wording that distinguishes Runtime Preflight Passed, Execution Started, and Agents Not Started.
- **FR-012**: System MUST preserve existing task, employee, approval, preflight, session, repository, movement, and dashboard high-priority state.

### Key Entities

- **RuntimeStart**: Immutable product-state record that binds an exact approved/preflighted execution context to an explicit human runtime-start decision.
- **RuntimeStartResult**: Immutable command result indicating Started, AlreadyStarted, Blocked, or Failed with deterministic reason codes.
- **RuntimeStartCommand**: Explicit human request containing project, Execution Plan, preflight, actor, and timestamp signals.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A valid explicit Runtime Start command creates exactly one Runtime Start record in one interaction.
- **SC-002**: Repeating the same valid command creates zero duplicate records and returns AlreadyStarted after revalidation.
- **SC-003**: 100% of blocked or failed starts preserve upstream records and keep agent/mutation flags false.
- **SC-004**: Dashboard tests cover unavailable, available, blocked, and started wording without any running, coding, reviewing, or repository-changing claims.

## Assumptions

- Runtime Start records may include audit timestamps, but timestamps do not determine identity or idempotency.
- The existing Runtime Preflight service is the source of current local safety evidence and is reused before Runtime Start.
- The human actor label remains provider-neutral as `Local Human`.
- Spec 075 or later will introduce actual agent process start after another revalidation gate.
