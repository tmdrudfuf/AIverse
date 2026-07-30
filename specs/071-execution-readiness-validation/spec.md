# Feature Specification: Execution Readiness Validation Foundation

**Feature Branch**: `codex/071-execution-readiness-validation`

**Created**: 2026-07-29

**Status**: Draft

**Input**: User description: "Spec 071 - Execution Readiness Validation Foundation"

## User Scenarios & Testing

### User Story 1 - Evaluate Execution Readiness (Priority: P1)

A human operator can explicitly evaluate whether one existing Execution Plan still satisfies current product-side readiness requirements for a later human execution decision. The result is a technical readiness snapshot only; it never grants human approval and never starts runtime execution.

**Why this priority**: This is the next safety boundary after Spec 070. Operators need a deterministic answer before any future approval or runtime feature can be considered.

**Independent Test**: Given a valid Execution Plan with matching current task, assignment, prepared session, active session, employee, repository evidence, agent labels, validation commands, and mutation scope, one explicit readiness action records a `Ready` result with all safety flags false and no source state changes.

**Acceptance Scenarios**:

1. **Given** a valid Execution Plan and matching current product state, **When** the human evaluates readiness, **Then** the system records immutable readiness checks and a `Ready` result that says human approval is not granted and execution is not started.
2. **Given** a valid prior readiness result, **When** the current employee or role context changes before a repeated evaluation, **Then** the system revalidates current state and records a `Blocked` result instead of reusing stale readiness.

---

### User Story 2 - Report Blocked Readiness (Priority: P2)

A human operator receives deterministic blocked reasons when the Execution Plan no longer matches current product state or required product-side evidence is missing, such as stale task state, mismatched active session, missing repository evidence, missing branch signal, missing role labels, missing validation commands, or unsafe mutation scope.

**Why this priority**: A `Ready` result must not mask stale state. Clear blocked checks let a later human or future feature know exactly what must be corrected without guessing from prose.

**Independent Test**: Each documented stale, missing, unsafe, or cross-project condition produces a `Blocked` result with check counts and reason codes, creates no partial state, and leaves task, employee, session, plan, repository, and GitHub state unchanged.

**Acceptance Scenarios**:

1. **Given** an Execution Plan whose active session now has agent execution flags set, **When** readiness is evaluated, **Then** the result is `Blocked` and no runtime state changes.
2. **Given** repository metadata exists but the worktree, branch, or spec signal is missing from product-side evidence, **When** readiness is evaluated, **Then** the result is `Blocked` with the corresponding reason code and no filesystem inspection.

---

### User Story 3 - View Readiness State Safely (Priority: P3)

A human operator can see readiness status in the project dashboard without confusing a technical `Ready` result with human approval, agent execution, subprocess activity, repository mutation, or GitHub mutation.

**Why this priority**: Readiness must be visible while preserving the staged safety language established by Specs 068-070.

**Independent Test**: Dashboard tests prove `Ready`, `Blocked`, and `Failed` wording, check counts, primary reason, and layout behavior while preserving existing source, sync, focus, active-session, and execution-plan row visibility.

**Acceptance Scenarios**:

1. **Given** a `Ready` readiness result, **When** the dashboard is displayed, **Then** it shows readiness checks passed, ready for human execution decision, human approval not granted, and execution not started.
2. **Given** a `Blocked` or `Failed` readiness result, **When** the dashboard is displayed, **Then** it shows blocked or failed wording, check counts, primary reason, and execution not started.

### Edge Cases

- The selected project changes between render and readiness input.
- The Execution Plan is missing, belongs to another project, or has an unsupported rules version.
- The task, assignment, prepared session, active session, employee, repository evidence, role context, validation commands, or mutation scope changes after a prior `Ready` result.
- The active session reports execution, agent, repository-mutation, or GitHub-mutation flags.
- Repository evidence lacks repository ID, repository path signal, worktree signal, branch signal, spec signal, or acceptable sync state.
- The role context no longer matches the Execution Plan.
- Validation commands contain empty entries or no longer match the plan.
- Mutation scope is missing or includes remote/GitHub/runtime permissions inconsistent with the plan.
- Same raw IDs appear in different projects.
- Readiness rows appear with source/sync/focus, active-session, and execution-plan rows in a crowded dashboard.

## Requirements

### Functional Requirements

- **FR-001**: The system MUST require a distinct explicit human action before evaluating execution readiness.
- **FR-002**: The system MUST create immutable readiness checks and a readiness result for one Execution Plan without granting human execution approval.
- **FR-003**: The system MUST use a deterministic readiness identifier derived from project and execution-plan identity.
- **FR-004**: The system MUST recalculate readiness at command time using current Execution Plan, ProjectTask, confirmed assignment, prepared session, active work session, employee, repository evidence, role context, validation commands, and mutation scope.
- **FR-005**: The system MUST reject missing, stale, malformed, unsupported, cross-project, or internally inconsistent Execution Plan inputs conservatively.
- **FR-006**: The system MUST reject readiness when the ProjectTask is missing, belongs to another project, no longer matches the plan, or is no longer in the active-work state used by the product.
- **FR-007**: The system MUST reject readiness when the confirmed assignment, prepared session, or active session is missing or mismatched.
- **FR-008**: The system MUST reject readiness when active session execution, agent, repository-mutation, or GitHub-mutation flags are true.
- **FR-009**: The system MUST reject readiness when the employee is missing, mismatched, or no longer logically compatible with the active session.
- **FR-010**: The system MUST validate only existing product-side repository evidence signals and MUST NOT inspect the real local filesystem.
- **FR-011**: The system MUST reject readiness when repository identity, repository metadata, repository path signal, worktree signal, branch signal, spec signal, or acceptable sync state is missing or mismatched.
- **FR-012**: The system MUST reject readiness when implementer or reviewer labels are missing or no longer match the Execution Plan.
- **FR-013**: The system MUST reject readiness when validation commands are missing, contain empty entries, or no longer match the Execution Plan in order.
- **FR-014**: The system MUST reject readiness when allowed mutation scope is missing, unsafe, or contradicts fixed false execution and mutation flags.
- **FR-015**: Readiness results MUST distinguish `Ready`, `Blocked`, and `Failed`.
- **FR-016**: Each readiness evaluation MUST expose deterministic check records with check ID, category, status, reason, and display-safe message.
- **FR-017**: Readiness records and results MUST keep `executionApproved`, `executionStarted`, `agentStarted`, `repositoryMutationStarted`, and `githubMutationStarted` false.
- **FR-018**: Readiness validation MUST preserve Execution Plan, task, employee, assignment, prepared-session, active-session, repository, and GitHub state unchanged.
- **FR-019**: The controller MUST not duplicate readiness validation business rules.
- **FR-020**: The dashboard MUST distinguish readiness from human approval, runtime execution, Codex, Claude, subprocesses, repository mutation, and GitHub mutation.
- **FR-021**: The dashboard MUST preserve Spec 070 priority-aware overflow behavior and MUST NOT unconditionally hide source, sync, focus, active-session, or execution-plan rows.
- **FR-022**: Product code MUST NOT import or invoke Node filesystem, path existence, child process, shell, Git, GitHub CLI, Codex CLI, or Claude CLI APIs for readiness validation.

### Key Entities

- **Execution Readiness**: Immutable local snapshot of product-side checks for one Execution Plan.
- **Execution Readiness Result**: Immutable command result recording `Ready`, `Blocked`, or `Failed`, check counts, primary reason, and fixed false safety flags.
- **Execution Readiness Check**: Individual deterministic check row with category, status, reason code, and display-safe message.
- **Execution Plan**: Existing Spec 070 plan that supplies target task, session, repository, role, validation, and mutation-scope context.
- **Product-Side Repository Evidence**: Existing domain state that describes repository identity, sync status, paths, branch, and spec signals without real filesystem inspection.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A valid Execution Plan evaluates to `Ready` with all required check categories represented.
- **SC-002**: 100% of documented stale, missing, cross-project, unsafe, and mismatched states produce `Blocked` or `Failed` without partial source-state changes.
- **SC-003**: Repeating readiness evaluation after changing current task, employee, role, repository evidence, validation commands, or mutation scope reflects the current state, not cached prior readiness.
- **SC-004**: The dashboard displays technical readiness with explicit human approval not granted and execution not started wording.
- **SC-005**: The full validation suite continues to pass and product code performs no filesystem, subprocess, agent, repository, or GitHub runtime action for readiness validation.

## Assumptions

- Spec 070 Execution Plan records are the source of target execution context.
- The current product can validate repository/worktree/branch/spec only from existing metadata and injected product-side evidence; real OS preflight is deferred.
- Default role labels are provider-neutral Implementer and Reviewer signals, not executable runtime permissions.
- A `Ready` result is a technical product-side state only and does not grant human approval.
- Durable persistence, execution approval, runtime startup, agent invocation, and repository mutation remain deferred.
