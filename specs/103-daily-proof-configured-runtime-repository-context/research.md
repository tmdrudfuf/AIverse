# Research: Daily Proof Configured Runtime Repository Context

## Decision: Reuse feature 102 local binding metadata

**Rationale**: Feature 102 already added normalized repository/worktree/branch/spec metadata with clone-safe registry and portal state propagation. Reusing it avoids a second representation of the same configured data.

**Alternatives considered**: Add execution-plan-specific configuration fields directly to controller state. Rejected because that would duplicate registry-owned metadata and increase drift risk.

## Decision: Treat missing branch evidence differently from mismatched branch evidence

**Rationale**: GitHub repository summaries do not represent a local worktree branch, so a missing `currentBranch` should not block a configured local runtime handoff. An explicit mismatched branch still represents stale or contradictory evidence and must block.

**Alternatives considered**: Require every repository snapshot to include `currentBranch`. Rejected because the existing GitHub sync provider does not produce local worktree branch evidence.

## Decision: No filesystem or git validation in this slice

**Rationale**: The handoff policy forbids validation/runtime execution in this environment, and feature 102 intentionally records configured metadata only. Real path and git checks remain part of runtime preflight/provider layers.

**Alternatives considered**: Read the local worktree to confirm branch/spec existence. Rejected because it would change this feature from configured metadata plumbing into local environment inspection.
