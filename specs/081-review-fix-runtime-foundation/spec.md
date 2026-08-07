# Feature Specification: Review Fix Runtime Foundation

**Feature Branch**: `codex/081-review-fix-runtime-foundation`  
**Created**: 2026-08-07  
**Status**: Draft  
**Input**: User description: "Spec 081 - Review Fix Runtime Foundation"

## User Scenarios & Testing

### User Story 1 - Start a Planned Review Fix Runtime (Priority: P1)

After an independent review returns Changes Requested, a Review Fix Request exists, and a Review Fix Plan has been explicitly created, a human can explicitly start one bounded runtime attempt to execute the exact current Review Fix Plan through the configured implementer-provider boundary.

**Why this priority**: Spec 080 intentionally stops at a plan. The next user-visible value is a distinct, auditable runtime boundary that can begin execution only after human intent.

**Independent Test**: Build a valid current review-fix context, press the distinct Start Review Fix Runtime input, and verify exactly one immutable runtime/result is recorded with exact upstream IDs, provider evidence, and no validation, reviewer, GitHub, push, PR, Ready, merge, deploy, or cleanup side effects.

**Acceptance Scenarios**:

1. **Given** a current project, current task, valid execution/review chain, Changes Requested decision, current Review Fix Request, and current Review Fix Plan, **When** a human starts the Review Fix Runtime, **Then** the runtime revalidates the current context, invokes only the configured implementer-provider boundary, and records immutable runtime/result/evidence for the exact plan.
2. **Given** the dashboard renders or refreshes while a current Review Fix Plan exists, **When** no explicit Start Review Fix Runtime input is received, **Then** no runtime starts and no provider is invoked.

---

### User Story 2 - Block Stale or Unsafe Runtime Starts (Priority: P1)

The system blocks before spawning a provider whenever the Review Fix Plan or its upstream chain is missing, stale, mismatched, malformed, unsafe, or no longer represents the current project and review context.

**Why this priority**: A stale plan must never become an execution authorization.

**Independent Test**: Mutate one authoritative precondition at a time, request a runtime start, and verify a blocked result is recorded without invoking the provider or mutating GitHub.

**Acceptance Scenarios**:

1. **Given** a Review Fix Plan from a prior context, **When** the review decision, request, target SHA, repository, branch, worktree, provider role, or project context has changed, **Then** the runtime returns a blocked result before provider spawn.
2. **Given** an actor that represents Codex, Claude, an agent, bot, automation, or workflow, **When** the actor requests runtime start, **Then** actor validation blocks before idempotency or provider checks.

---

### User Story 3 - Repeat Exact Starts Idempotently (Priority: P2)

Repeated explicit human starts for the exact same successfully completed current runtime return the existing immutable outcome only after the current context and actor are revalidated.

**Why this priority**: Users may repeat an input, but old executions must not mask changed or stale context.

**Independent Test**: Complete a runtime for one exact context, repeat the explicit start and verify idempotency; then change an upstream context and verify the historical runtime no longer authorizes the start.

**Acceptance Scenarios**:

1. **Given** a completed Review Fix Runtime for the exact current plan context, **When** the same human repeats Start Review Fix Runtime, **Then** the result reports the prior completed runtime without creating a duplicate provider attempt.
2. **Given** a historical runtime that appears similar but belongs to a previous plan/request/project/SHA context, **When** a start is requested for the current context, **Then** the historical runtime is ignored or blocked and cannot authorize execution.

## Requirements

### Functional Requirements

- **FR-001**: The system MUST introduce provider-neutral Review Fix Runtime domain records downstream of Review Fix Plan.
- **FR-002**: The system MUST model at least a start command, runtime record, runtime result, runtime evidence, runtime collection, and runtime result collection.
- **FR-003**: A Review Fix Runtime MUST start only from a distinct explicit human action equivalent to "Start Review Fix Runtime".
- **FR-004**: Rendering, refresh, dashboard updates, request creation, plan creation, reviewer result creation, timers, polling, labels, automation, and agent actions MUST NOT start the runtime.
- **FR-005**: Actor validation MUST reject Codex, Claude, agent, bot, automation, and workflow actors before idempotent or replay short-circuit logic.
- **FR-006**: Before provider invocation, the service MUST revalidate the current project, task, execution plan/readiness/approval context where represented, runtime chain integrity, implementer runtime, review target, reviewer runtime/result, Changes Requested decision, Review Fix Request, Review Fix Plan, employee, repository, worktree, branch, provider role binding, validation-command snapshot, mutation scope, rules versions, and expected SHA context through existing canonical upstream boundaries where available.
- **FR-007**: A missing, stale, malformed, cross-project, mismatched, or no-longer-current Review Fix Plan MUST block before provider spawn.
- **FR-008**: A review decision that no longer resolves to Changes Requested MUST block before provider spawn.
- **FR-009**: Repository, worktree, branch, review target SHA, expected HEAD, provider role, or unsafe command mismatches MUST block before provider spawn.
- **FR-010**: The runtime MAY permit only local fix execution inherent to the explicitly authorized review-fix runtime and MUST NOT authorize push, GitHub mutation, PR creation/update, Ready for Review, merge, branch deletion, remote branch deletion, deploy, automatic validation runtime, automatic reviewer runtime, or automatic promotion.
- **FR-011**: Runtime status and result status MUST remain coherent and follow existing implementer/reviewer runtime status conventions.
- **FR-012**: Provider output needed for status and evidence decisions MUST be evaluated before display bounding or truncation.
- **FR-013**: Deterministic runtime and result identities MUST bind to project plus the exact Review Fix Plan/runtime context, avoid random or order-based values, and prevent cross-project collisions.
- **FR-014**: Repeated explicit start for an exact already-completed current runtime MUST behave idempotently only after actor and current-context revalidation.
- **FR-015**: Historical records MUST remain immutable and MUST NOT mask a newer or stale current context.
- **FR-016**: The dashboard MUST expose a truthful Review Fix Runtime row that distinguishes ready, blocked, started/running where represented, completed, failed, timed out, and the fact that validation and re-review have not yet run.
- **FR-017**: The input action for Start Review Fix Runtime MUST be distinct from all existing office/project actions and MUST NOT trigger another state transition from the same key press.

### Key Entities

- **ReviewFixRuntimeCommand**: Explicit human command to start the current Review Fix Plan runtime.
- **ReviewFixRuntime**: Immutable record for one bounded provider attempt tied to an exact Review Fix Plan and current review-fix context.
- **ReviewFixRuntimeResult**: Immutable result describing the outcome of a start attempt, including blocked/idempotent/provider outcomes.
- **ReviewFixRuntimeEvidence**: Provider execution evidence for the exact attempt.
- **ReviewFixRuntimeCollection**: Immutable project-scoped collection of runtime records.
- **ReviewFixRuntimeResultCollection**: Immutable project-scoped collection of runtime result records.

## Success Criteria

- **SC-001**: Focused tests prove explicit human start creates one runtime/result and no automatic start occurs during render or refresh.
- **SC-002**: Focused tests prove non-human actors, stale plans, mismatched requests/decisions/context, unsafe commands, and provider failures block before unsafe side effects.
- **SC-003**: Focused tests prove deterministic IDs, immutable collections, idempotent repeat starts, and cross-project isolation.
- **SC-004**: Full validation passes with `npm test`, `npx tsc --noEmit`, `npm run build`, `git diff --check`, and `git diff --cached --check`.

## Assumptions

- The runtime uses the established implementer-provider boundary rather than adding a new vendor-specific execution model.
- Validation Runtime, automatic reviewer runtime, re-review promotion, GitHub automation, PR operations, and cleanup remain later-spec work.
- Existing Review Fix Request and Review Fix Plan services remain authoritative for downstream context revalidation.
