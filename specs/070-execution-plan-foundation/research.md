# Research: Execution Plan Foundation

## Decision: Use a focused execution-plan module

**Rationale**: A sibling `execution-plans/` module keeps the new boundary separate from active-session start and future runtime execution. It matches the established Spec 064-069 pattern of small provider-neutral domain modules.

**Alternatives considered**:

- Extend `active-work-sessions/`: rejected because it would blur active-session state and execution-plan state.
- Add a generic workflow engine: rejected as broader than the feature scope.

## Decision: Keep execution plans immutable

**Rationale**: Plans capture a point-in-time execution context. Rewriting path, branch, task, assignment, or session provenance would make later execution evidence ambiguous.

**Alternatives considered**:

- Mutable plan records: rejected because stale context could be silently rewritten.
- Store only latest plan per project: rejected because plans must be tied to active-session identity.

## Decision: Use deterministic active-session-based plan IDs

**Rationale**: `<projectId>:execution-plan:<activeSessionId>:plan-v1` gives stable identity without timestamps or random UUIDs and naturally scopes plans to one project and active session.

**Alternatives considered**:

- Use ProjectTask ID only: rejected because a future rules version or active-session lineage could collide.
- Use timestamps: rejected because repeated mapping would be nondeterministic.

## Decision: Validate worktree/spec availability using local product metadata and filesystem checks

**Rationale**: The plan needs enough context for a future agent while not invoking Git, GitHub, Codex, Claude, or subprocesses from product code. Validation can consume controller-provided repository path, branch, and spec path data plus injected existence checks.

**Alternatives considered**:

- Run Git commands during plan creation: rejected because product code must not spawn subprocesses.
- Skip local existence checks: rejected because the plan could claim unavailable context is ready.

## Decision: Store role labels, not runtime commands

**Rationale**: The feature records Implementer/Reviewer context but does not grant runtime permissions or execute agents. Provider-neutral labels preserve the workflow contract without introducing CLI invocation.

**Alternatives considered**:

- Store concrete CLI command arguments: rejected because it suggests runtime readiness and provider coupling.
- Omit roles: rejected because the required plan data includes implementer and reviewer agent context.
