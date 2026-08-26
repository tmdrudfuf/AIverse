# Research: Trusted Local ADOS Execution Bridge

## Decision 1: Add a dedicated external ADOS execution module

**Decision**: Implement bridge validation, result creation, and provider invocation in `external-ados-execution`.

**Rationale**: Existing primary runtime services require promoted tasks, work sessions, execution plans, readiness, approval, preflight, and runtime-start records. External ADOS preparation is a different workflow seam and should not manufacture primary pipeline state.

**Alternatives considered**: Reusing `ImplementerRuntimeService` directly was rejected because its context validation intentionally requires primary AIverse task-chain records that external project preparation does not own.

## Decision 2: Use the existing implementer provider boundary

**Decision**: Invoke the existing `ClaudeImplementerRuntimeProvider` contract from the bridge service after trusted metadata checks pass.

**Rationale**: The provider already centralizes command safety, browser/Node spawn guards, timeout-bounded execution, and bounded output evidence.

**Alternatives considered**: Adding a new process-spawn implementation was rejected because it would duplicate safety checks and increase the risk of drift.

## Decision 3: Treat local dashboard activation as the bridge trust signal

**Decision**: The bridge records `trustedLocalExecutionApproved: true` only when the Project Dashboard action reaches a valid prepared external ADOS record.

**Rationale**: Prior features already use explicit dashboard actions as local human gates. The bridge keeps that pattern while still validating metadata and local worktree binding before invoking the provider.

**Alternatives considered**: Adding another modal or global approval flow was rejected for v1 because there is no existing modal approval pattern in this dashboard path.

## Decision 4: Keep validation and review outside this bridge

**Decision**: Bridge records always keep validation, review, GitHub, repository mutation, publish, merge, and deploy indicators false.

**Rationale**: The feature request is specifically the missing execution bridge. Validation and review are separate policy-controlled workflow steps and must not be silently started by this capability.

**Alternatives considered**: Chaining validation or reviewer runtime after implementer completion was rejected as out of scope and contrary to the handoff constraints.
