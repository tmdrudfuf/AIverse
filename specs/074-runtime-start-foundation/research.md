# Research: Runtime Start Foundation

## Decision: Runtime Start is a sibling domain after Runtime Preflight

**Rationale**: Runtime Preflight already owns current local safety checks. Runtime Start should consume a current Ready preflight and record the product state boundary without adding process execution.

**Alternatives considered**: Mutating Runtime Preflight to started was rejected because preflight is a safety snapshot, not an execution-start decision.

## Decision: Fresh preflight is required before start

**Rationale**: Repository, branch, worktree, command, agent, and mutation-scope evidence can change after a previous Ready result. Re-running current preflight preserves Spec 073.

**Alternatives considered**: Trusting stored Ready results was rejected as stale-prone.

## Decision: Runtime Start can set `executionStarted` but not agent/mutation flags

**Rationale**: Spec 074 is the first execution-start product-state boundary. It still precedes any real agent process.

**Alternatives considered**: Waiting until actual Codex process start to set `executionStarted` was rejected because Spec 074 explicitly introduces a product Runtime Start state.
