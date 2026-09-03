# Feature Specification: Controlled Backlog Readiness Promotion Policy

**Feature Branch**: `codex/146-controlled-backlog-readiness-promotion-policy`

**Created**: 2026-09-02

**Status**: Draft

**Input**: User description: "Add a project-scoped, operator-controlled policy that can automatically promote eligible Spec 141 backlog tasks into Ready state while preserving the safety boundary between AI suggestion acceptance, Ready promotion, and autonomous execution."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Enable Auto Ready Per Project (Priority: P1)

An operator can explicitly enable or disable automatic backlog readiness promotion for one canonical project without affecting any other project.

**Why this priority**: Explicit project-scoped consent is the central safety requirement.

**Independent Test**: Use two registered projects, enable Auto Ready only for Project A, reload the session, and confirm Project B remains disabled.

**Acceptance Scenarios**:

1. **Given** Project A and Project B are canonical registered projects, **When** the operator enables Auto Ready for Project A, **Then** Project A records Auto Ready On and Project B remains Auto Ready Off.
2. **Given** no operator has enabled Auto Ready for a project, **When** the backlog is viewed or reloaded, **Then** automatic readiness promotion remains Off.
3. **Given** Spec 145 AI Auto Accept or Spec 144 Autonomous Execution is enabled, **When** Auto Ready has not been explicitly enabled, **Then** Auto Ready remains Off.

---

### User Story 2 - Promote Eligible Backlog Tasks Safely (Priority: P1)

When an operator evaluates readiness, the system deterministically promotes only valid, same-project backlog tasks that satisfy the project policy.

**Why this priority**: The feature only exists to perform safe `backlog -> Ready` promotion.

**Independent Test**: With Project A Auto Ready On for high priority and max 1, create high and low backlog tasks, evaluate, and confirm only the high task becomes Ready exactly once.

**Acceptance Scenarios**:

1. **Given** Project A Auto Ready is On, allowed priority is high, and max promotions is 1, **When** Project A has one high and one low backlog task, **Then** exactly one high task is promoted to Ready and the low task remains backlog.
2. **Given** a task is already Ready, In Progress, Blocked, Completed, Cancelled, archived, invalid, malformed, or disconnected from the project, **When** readiness is evaluated, **Then** the task is not automatically promoted.
3. **Given** multiple eligible tasks, **When** readiness is evaluated, **Then** selection follows allowed priority order, oldest creation time, then stable task id.

---

### User Story 3 - Preserve Execution Boundary (Priority: P1)

Automatic readiness promotion stops at Ready and never starts development or mutates execution systems directly.

**Why this priority**: Spec 146 must connect backlog planning to Ready state without bypassing Spec 142 or Spec 144 controls.

**Independent Test**: Evaluate Auto Ready while instrumenting or inspecting execution state and confirm no development request, autonomous coordinator call, ADOS process, Git operation, or GitHub mutation occurs.

**Acceptance Scenarios**:

1. **Given** an eligible backlog task is promoted, **When** evaluation completes, **Then** the task state is Ready and no Ready-to-In-Progress transition is performed by Spec 146.
2. **Given** an active project execution exists and the policy requires no active execution, **When** readiness is evaluated, **Then** promotion is skipped with an active execution reason.

---

### User Story 4 - Audit and Portfolio Awareness (Priority: P2)

The operator can see compact project-scoped Auto Ready state and latest deterministic evaluation reason in the office, while the portfolio may show read-only summary information.

**Why this priority**: Operators need visibility without introducing hidden consent or a new dashboard.

**Independent Test**: View the project backlog planning surface and portfolio summaries after changing policy and running an evaluation; verify displayed status is scoped and read-only.

**Acceptance Scenarios**:

1. **Given** a project backlog planning surface is open, **When** Auto Ready policy exists, **Then** the office displays canonical project, Auto Ready On/Off, allowed priorities, maximum promotions, and concise latest result.
2. **Given** the portfolio view displays Auto Ready information, **When** the operator views portfolio summaries, **Then** the display does not mutate policy or task state.

### Edge Cases

- Missing, malformed, stale, ambiguous, unsupported, or cross-project policy state resolves to manual backlog promotion only.
- A disconnected, removed, stale, non-canonical, unavailable, or mismatched project skips promotion and never falls back to another project.
- Unknown or malformed task priorities and provenance values do not bypass policy filters.
- Repeated evaluation, reload, duplicate events, and repeated Spec 145 completion events are idempotent.
- Promotion failure before the Ready transition leaves the task in backlog and produces a concise reason.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Auto Ready MUST be disabled by default for every canonical project.
- **FR-002**: Operators MUST be able to explicitly enable and disable Auto Ready per canonical project.
- **FR-003**: Spec 145 AI Auto Accept, Spec 146 Auto Ready, and Spec 144 Autonomous Execution MUST remain independently visible, configurable, and persisted.
- **FR-004**: Auto Ready policy MUST be project-scoped with no global fallback policy.
- **FR-005**: Only tasks currently in backlog MAY be considered for automatic promotion.
- **FR-006**: Evaluation MUST require exact project ownership across task, policy, and current canonical registered project.
- **FR-007**: Evaluation MUST validate task id, title, required description, backlog state, supported priority, valid provenance where present, structured task shape, freshness, and prior promotion state before promotion.
- **FR-008**: Operators MUST be able to restrict auto-promotion by existing backlog priority values.
- **FR-009**: Operators MUST be able to restrict auto-promotion by existing task provenance where supported safely.
- **FR-010**: Duplicate protection MUST prevent promotion when equivalent work is already Ready, In Progress, in an active development request, or in an active execution task for the same project.
- **FR-011**: The default policy MUST require no active project execution before promotion.
- **FR-012**: Each evaluation MUST enforce a bounded promotion count with default max 1 and reject unbounded values.
- **FR-013**: Multiple eligible tasks MUST be ordered deterministically by configured priority order, oldest created timestamp, then stable task id.
- **FR-014**: Promotion MUST reuse the existing Spec 141 backlog transition semantics.
- **FR-015**: Spec 146 MUST only perform backlog to Ready and MUST NOT directly start development, invoke Spec 142, invoke Spec 144, invoke ADOS/Codex/Claude, or mutate Git/GitHub.
- **FR-016**: Safe triggers MAY include explicit operator evaluation, policy enable/change, backlog task creation, Spec 145 acceptance evaluation completion, or prior execution completion, but MUST NOT create continuous polling or unbounded self-triggering loops.
- **FR-017**: Policies and latest concise evaluation results MUST persist through the existing browser/project session persistence architecture without creating consent on reload.
- **FR-018**: Existing manual backlog creation, editing, blocking, cancelling, and manual Ready promotion MUST remain functional.
- **FR-019**: The office UI MUST add compact project-scoped controls near the existing project backlog/autonomy planning surface.
- **FR-020**: Portfolio awareness MAY show project-scoped read-only Auto Ready and backlog/Ready summary information and MUST NOT mutate policy.

### Key Entities

- **Backlog Readiness Promotion Policy**: Project-scoped operator consent and filters for automatic backlog-to-Ready promotion.
- **Readiness Evaluation Result**: Deterministic audit record containing promoted tasks, skipped tasks, evaluation time, and concise latest result text.
- **Project Backlog Task**: Existing Spec 141 task record that remains the authoritative task representation and transition target.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: With two projects, enabling Auto Ready for Project A leaves Project B disabled in 100% of trials.
- **SC-002**: Each readiness evaluation promotes no more than the configured bounded maximum, defaulting to exactly one or fewer tasks.
- **SC-003**: Re-running evaluation after a task was promoted creates zero duplicate Ready representations.
- **SC-004**: Runtime evidence demonstrates no direct Spec 142, Spec 144, ADOS, Git, GitHub, Codex, or Claude invocation from Spec 146.
- **SC-005**: Reload restores enabled state, filters, bounds, safety settings, and latest concise evaluation result without changing disabled policies to enabled.

## Assumptions

- Existing registered projects, project-company binding, backlog stores, task statuses, priorities, provenance fields, and browser session persistence are reused.
- "Origin" maps to existing suggestion provenance fields where present: operator-created tasks have no suggestion source, manually accepted suggestions use manual acceptance mode, and automatically accepted suggestions use automatic acceptance mode.
- Initial implementation prefers one active execution boundary per project and skips promotion during active work.
