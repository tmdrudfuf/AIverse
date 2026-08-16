# Feature Specification: Daily Proof Configured Runtime Repository Context

**Feature Branch**: `codex/103-daily-proof-configured-runtime-repository-context`

**Created**: 2026-08-15

**Status**: Draft

**Input**: User description: "Daily Proof Configured Runtime Repository Context"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Use the configured Daily Proof worktree for runtime planning (Priority: P1)

As an AIverse operator starting a Daily Proof implementation workflow, I need runtime planning to use the configured primary repository path, feature worktree path, feature branch, and Spec Kit path instead of collapsing everything into a single local path.

**Why this priority**: Runtime handoffs must point the implementer at the exact feature worktree while preserving the primary repository as separate context.

**Independent Test**: Drive Daily Proof through execution-plan creation and confirm the plan records the configured repository root, worktree, branch, and spec path.

**Acceptance Scenarios**:

1. **Given** Daily Proof has configured local binding metadata, **When** an execution plan is created, **Then** the plan uses the configured repository root, worktree path, branch name, and spec path.
2. **Given** the configured worktree differs from the primary repository path, **When** runtime start context is created, **Then** the runtime record preserves both paths without replacing one with the other.

---

### User Story 2 - Preserve stale-context blocking (Priority: P2)

As an operator, I need runtime planning to block when verified repository evidence contradicts the configured runtime branch.

**Why this priority**: Configured metadata should fill missing local context, not override explicit evidence that the workflow is pointed at the wrong branch.

**Independent Test**: Change the repository snapshot branch after a plan exists and confirm revalidation blocks the downstream runtime chain as stale.

**Acceptance Scenarios**:

1. **Given** repository evidence reports a branch different from the configured runtime branch, **When** an execution plan is created or revalidated, **Then** the plan is blocked for unavailable branch context.
2. **Given** repository evidence has no local branch signal but configured binding has one, **When** an execution plan is created, **Then** runtime planning may use the configured branch.

### Edge Cases

- Daily Proof has no configured local binding: existing local path fallback behavior remains available.
- A configured binding omits branch or spec path: existing fallback values are used where available.
- Configured context remains metadata only; it does not prove paths exist, read the filesystem, spawn subprocesses, call git, or mutate a repository.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Daily Proof MUST have configured runtime repository context containing primary repository path, feature worktree path, branch name, and spec path.
- **FR-002**: Execution-plan creation MUST prefer configured local binding metadata over the generic repository identity local path when building runtime repository context.
- **FR-003**: Runtime start records and downstream runtime prompts MUST preserve the configured worktree path, branch, and spec path from the execution plan.
- **FR-004**: If verified repository evidence includes a current branch that differs from the configured runtime branch, planning MUST block instead of silently accepting the configured branch.
- **FR-005**: If verified repository evidence omits a current branch, planning MAY rely on the configured runtime branch.
- **FR-006**: The feature MUST NOT read the filesystem, spawn subprocesses, call git or GitHub mutation APIs, or validate path existence.

### Key Entities

- **Daily Proof Runtime Repository Context**: Configured primary repository path, worktree path, branch name, and spec path used to build execution-plan and runtime-start records.
- **Execution Plan Repository Context**: Existing runtime planning data that now preserves configured root/worktree separation.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Daily Proof execution plans expose the configured primary repository path and configured feature worktree path as two distinct values.
- **SC-002**: Daily Proof runtime start handoff records include the configured branch and spec path for feature 103.
- **SC-003**: A mismatched explicit branch signal still blocks runtime planning before runtime start.
- **SC-004**: No new source code performs filesystem reads, subprocess execution, git commands, or GitHub mutation.

## Assumptions

- Feature 102 already provides configured local binding metadata and safe copy boundaries.
- Real filesystem and git-state verification remain owned by later runtime environment providers.
- ADOS validation is performed outside this runtime per handoff policy.
