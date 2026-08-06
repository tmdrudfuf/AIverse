# Feature Specification: Review Decision Human Promotion Gate

**Feature Branch**: `codex/077-review-decision-human-promotion-gate`

**Created**: 2026-08-01

**Status**: Draft

**Input**: User description: "Spec 077 interprets Codex Reviewer Runtime outcomes and exposes a safe, explicit, human-controlled decision boundary. It must consume the current Reviewer Runtime record/result for the exact active execution chain, revalidate the complete upstream chain before deriving or accepting a decision, represent the Reviewer Runtime outcome without inventing approval, derive a stable review-decision classification, require an explicit human input distinct from every existing action before promotion, permit promotion only from an exact current Approved reviewer result, prevent promotion from any non-Approved, stale, mismatched, missing, or malformed outcome, preserve full chain linkage, and never claim PR creation, push, merge, validation success, repository mutation, or deployment."

## User Scenarios & Testing

### User Story 1 - Interpret the Reviewer Runtime Decision (Priority: P1)

A human operator, viewing a project whose Codex Reviewer Runtime has produced a terminal result, sees a truthful classification of that result — `Approved`, `Changes Requested`, `Blocked`, `Timed Out`, `Failed`, or `Unavailable`/`Stale` — derived only from the exact current Reviewer Runtime record and result for the active execution chain, never a fabricated or assumed approval.

**Why this priority**: Every other requirement in this feature exists to make one downstream action (human promotion) safe; that action is only safe if the classification feeding it is itself an honest, unmodified read of what Codex actually produced.

**Independent Test**: Build a valid chain through a Completed Reviewer Runtime with an `Approved` decision, and verify the derived classification is exactly `Approved`. Build the same chain with `ChangesRequested`, `Unknown`, `TimedOut`, `Blocked`, or `Failed` Reviewer Runtime outcomes, and verify each derives its own distinct, truthful classification — never `Approved`.

**Acceptance Scenarios**:

1. **Given** a Completed Reviewer Runtime with decision `Approved` for the current execution chain, **When** the classification is derived, **Then** it reports `Approved` and nothing else changes state.
2. **Given** a Completed Reviewer Runtime with decision `ChangesRequested` or `Unknown`, **When** the classification is derived, **Then** it reports `ChangesRequested` (or a distinct not-approved state for `Unknown`) — never `Approved`.
3. **Given** a `TimedOut`, `Blocked`, or `Failed` Reviewer Runtime result, **When** the classification is derived, **Then** it reports the matching truthful state, never `Approved` and never a generic "error."
4. **Given** no Reviewer Runtime attempt yet for the current chain, **When** the classification is derived, **Then** it reports `Unavailable`.
5. **Given** a Reviewer Runtime result that exists but no longer matches the current upstream chain (plan, readiness, approval, preflight, Runtime Start, Implementer Runtime, or role binding has since changed), **When** the classification is derived, **Then** it reports `Stale`, never the outcome recorded before the change.

---

### User Story 2 - Human Promotion of an Approved Decision (Priority: P1)

A human operator, seeing an `Approved` classification, takes a single explicit action — distinct from every existing pipeline action — that revalidates the complete chain one final time and, only if everything still holds, records one immutable Review Promotion for the exact reviewer result being promoted.

**Why this priority**: This is the only new state-changing capability this feature introduces. It is the human-controlled boundary the whole feature exists to provide: a deliberate, revalidated, non-automatic acknowledgment that a specific Approved review may be acted on next, without the system taking any further action itself.

**Independent Test**: Build a valid chain through a Completed, unstale, `Approved` Reviewer Runtime, issue the explicit Promote action, and verify exactly one immutable Review Promotion record is created, carrying the exact reviewer/implementer/runtime-start/plan/project linkage, with every mutation/validation/GitHub flag literally `false`. Press Promote again for the same reviewer result and verify no second record is created and no additional validation, agent, or mutation occurs.

**Acceptance Scenarios**:

1. **Given** a Completed, unstale, `Approved` Reviewer Runtime for the current chain, **When** the human takes the explicit Promote action, **Then** the system revalidates the full chain once more and, if it still holds, records exactly one immutable Review Promotion carrying the exact chain linkage.
2. **Given** the dashboard renders, re-renders, the controller initializes, or navigation occurs, **When** an `Approved` classification is present, **Then** no Review Promotion is ever created without the distinct explicit Promote action.
3. **Given** an already-Promoted reviewer result, **When** the human presses Promote again, **Then** the existing Review Promotion is returned unchanged — no duplicate record, no re-validation side effect beyond the idempotent read, no agent invocation.
4. **Given** a Review Promotion has just been recorded, **Then** the dashboard shows it paired with an explicit statement that no push, PR, merge, validation, repository mutation, or deployment has occurred — promotion is a human decision record only.

---

### User Story 3 - Block Promotion From Any Non-Approved, Stale, or Mismatched State (Priority: P2)

A human operator attempting to promote anything other than an exact, current, `Approved` Reviewer Runtime receives a safe, deterministic block with a distinct reason code, and no Review Promotion is ever created.

**Why this priority**: A Promotion record is a durable, immutable human decision artifact. Creating one from a stale, mismatched, non-Approved, or malformed context would make that artifact untrustworthy — this is the safety boundary the rest of the feature depends on.

**Independent Test**: Individually construct a `ChangesRequested`, `Unknown`, `TimedOut`, `Blocked`, `Failed`, missing, or upstream-stale Reviewer Runtime context, press Promote against each, and verify every one blocks with a distinct reason code and no Review Promotion record is created.

**Acceptance Scenarios**:

1. **Given** a Reviewer Runtime whose decision is `ChangesRequested` or `Unknown`, **When** Promote is pressed, **Then** the result is blocked with a decision-not-approved reason and no record is created.
2. **Given** a Reviewer Runtime that is `TimedOut`, `Blocked`, or `Failed`, or that does not exist yet, **When** Promote is pressed, **Then** the result is blocked with a distinct reason and no record is created.
3. **Given** an `Approved` Reviewer Runtime whose upstream chain (plan, readiness, approval, preflight, Runtime Start, Implementer Runtime, or role binding) no longer revalidates identically, **When** Promote is pressed, **Then** the result is blocked as stale and no record is created.
4. **Given** an `Approved` Reviewer Runtime for a different project, plan, or review target than the one currently active, **When** Promote is pressed, **Then** the result is blocked as mismatched and no record is created.
5. **Given** a Promote actor label equivalent to Claude, Codex, agent, bot, automation, or workflow, **When** Promote is pressed, **Then** the result is blocked and no record is created.

### Edge Cases

- Switching to a different project's dashboard never shows a previous project's review-decision classification or Review Promotion.
- An `Approved` classification derived once and rendered is never treated as still valid after the underlying chain has since changed; the block/promotion check always re-derives from current state, never from a previously rendered value.
- A historical Review Promotion remains immutable but is not shown as currently applicable if a later action (for example, restarting an earlier pipeline stage) has since invalidated the chain it was built from.
- Actor labels equivalent to Claude, Codex, agent, bot, automation, or workflow are rejected as the human Promote actor.
- Reaching an `Approved` classification, opening the dashboard, or the passage of time never triggers a Review Promotion by itself.
- Pressing Promote does not start, restart, or re-invoke the Claude Implementer or Codex Reviewer provider under any circumstance.
- Pressing Promote never stages files, commits, pushes, creates or updates a PR, marks a PR ready, merges, or performs any other GitHub mutation.
- A second, unrelated `Approved` Reviewer Runtime for the same project (for example, a later attempt after the promoted one was invalidated and redone) is promotable independently and produces its own distinct Review Promotion — it is never confused with, and never blocked by, an earlier promotion for a different reviewer result.

## Requirements

### Functional Requirements

- **FR-001**: System MUST derive a review-decision classification (`Approved`, `ChangesRequested`, `Blocked`, `TimedOut`, `Failed`, `Unavailable`, or `Stale`) from only the current Reviewer Runtime record and result for the active execution chain — never inventing, upgrading, or assuming a decision the Reviewer Runtime did not itself produce.
- **FR-002**: System MUST classify a Reviewer Runtime result as `Stale` (never as its originally recorded decision) whenever the upstream Execution Plan, Execution Readiness, Human Execution Approval, Runtime Preflight, Runtime Start, Implementer Runtime, or approved role binding no longer revalidates identically to what the Reviewer Runtime was built from.
- **FR-003**: System MUST require a distinct, explicit human Promote action, never triggered by an `Approved` classification's existence, dashboard render, controller initialization, navigation, or elapsed time, and never satisfied by the same keypress as Start-Implementer, Start-Reviewer, or any existing generic action (Enter/Space/Escape/Arrow keys).
- **FR-004**: System MUST reject Promote actor labels equivalent to Claude, Codex, agent, bot, automation, or workflow.
- **FR-005**: System MUST revalidate, in order, Execution Plan, Execution Readiness, Human Execution Approval, Runtime Preflight, Runtime Start, Implementer Runtime (`Completed`, unstale), Reviewer Runtime (`Completed`, unstale, decision exactly `Approved`), and the approved Implementer/Reviewer role binding immediately before recording a Review Promotion — never relying on a previously rendered classification.
- **FR-006**: System MUST permit a Review Promotion to be created only when the freshly revalidated Reviewer Runtime decision is exactly `Approved`; every other decision, status, or missing/stale/mismatched context MUST block with a distinct reason code and MUST NOT create a record.
- **FR-007**: System MUST produce exactly one immutable Review Promotion record per distinct Reviewer Runtime attempt; a second Promote action against the same already-Promoted Reviewer Runtime MUST return the existing record unchanged and MUST NOT create a duplicate, mutate upstream state, or invoke any provider.
- **FR-008**: System MUST preserve on the Review Promotion record the exact project, plan, branch, repository, worktree, Runtime Start, Implementer Runtime, Reviewer Runtime, and review-target linkage it was created from.
- **FR-009**: System MUST NOT invoke Claude, MUST NOT invoke Codex, MUST NOT start or restart any Implementer or Reviewer Runtime attempt, and MUST NOT stage files, commit, push, create or update a PR, mark a PR ready, merge, or perform any other GitHub mutation, as part of this feature.
- **FR-010**: System MUST keep `validationStarted`, `repositoryMutationStarted`, and `githubMutationStarted` false on every Review Promotion record, unconditionally, regardless of outcome.
- **FR-011**: System MUST invalidate a project's current review-decision classification and any existing Review Promotion display whenever upstream plan/readiness/approval/preflight/Runtime Start/Implementer Runtime/Reviewer Runtime revalidation invalidates, using the same shared invalidation path those stages already use — without deleting an already-recorded, historically immutable Review Promotion.
- **FR-012**: System MUST expose Project Dashboard rows for the review-decision classification and, once created, the Review Promotion, using safe wording that never claims a merge, a push, a PR, a validation pass, a repository mutation, or a deployment.
- **FR-013**: System MUST preserve existing Runtime Start, Implementer Runtime, and Reviewer Runtime dashboard rows; when the lower panel's row budget is exceeded, the review-decision/promotion rows MUST be no higher priority to keep than the existing Reviewer Runtime row.

### Key Entities

- **ReviewDecisionState**: Derived, non-persisted classification (`Approved` | `ChangesRequested` | `Blocked` | `TimedOut` | `Failed` | `Unavailable` | `Stale`) computed fresh from the current Reviewer Runtime record/result and full upstream chain — never itself stored, never itself a source of truth.
- **ReviewPromotionRequest**: Explicit human request containing project, the Reviewer Runtime being promoted, and actor/timestamp signals.
- **ReviewPromotion**: Immutable product-state record created only from an exact, freshly revalidated, `Approved` Reviewer Runtime, carrying full chain linkage and literal-`false` mutation/validation safety flags.
- **ReviewPromotionResult**: Immutable command result indicating whether a Review Promotion was granted or blocked, carrying a deterministic reason code and the same literal-`false` safety flags.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A valid explicit Promote action against a Completed, unstale, `Approved` Reviewer Runtime produces exactly one Review Promotion record in one interaction.
- **SC-002**: 100% of blocked Promote attempts (non-Approved decision, non-Completed status, stale chain, mismatched context, missing Reviewer Runtime, or invalid actor) preserve upstream records unchanged and create no Review Promotion.
- **SC-003**: 100% of Review Promotion records keep `validationStarted`, `repositoryMutationStarted`, and `githubMutationStarted` false.
- **SC-004**: A duplicate Promote action against an already-Promoted Reviewer Runtime never creates a second record and never re-invokes any provider.
- **SC-005**: Dashboard tests cover unavailable, ready-not-approved, approved-not-yet-promoted, blocked, stale, and promoted states, and never pair any of them with "Merged," "Pushed," "PR Created," "Validation Passed," or "Repository Mutated" wording.
- **SC-006**: Every test asserting the stale-chain block does so by invalidating exactly one upstream stage at a time (plan, readiness, approval, preflight, Runtime Start, Implementer Runtime, Reviewer Runtime, or role binding) and verifying the classification becomes `Stale` and Promote blocks.

## Assumptions

- The existing Execution Plan/Execution Readiness/Human Execution Approval/Runtime Preflight/Runtime Start/Implementer Runtime/Reviewer Runtime services are reused unmodified; Spec 077 does not alter their validation logic or introduce a new provider process.
- The human actor label remains provider-neutral as `Local Human`, consistent with every prior stage.
- This feature performs no subprocess invocation, no I/O, and no asynchronous operation; every operation (classification derivation, chain revalidation, Review Promotion creation) is synchronous, deterministic, in-memory state, following the existing "represented" pattern this repository's pipeline stages use.
- Because Spec 076's deterministic Review Target resolver always reports `workingTreeState: "Uncommitted"` in this repository today, no controller-driven Reviewer Runtime attempt currently reaches a real `Completed`/`Approved` outcome — the review-decision classification and Review Promotion paths are exercised in tests via a directly constructed `Approved` Reviewer Runtime fixture at the service level, exactly as Spec 076's own real-spawn path is exercised. This is a known, accepted limitation shared with Spec 076, not a defect introduced by this feature.
- The dedicated product Validation stage and any real GitHub mutation (commit, push, PR, merge) remain out of scope for this feature and are deferred to a later spec; Spec 077 only records a human decision boundary, it does not act on it.
- Existing approved sibling implementations (Spec 075's Implementer Runtime, Spec 076's Reviewer Runtime) are treated as reference implementations for chain-revalidation depth; this feature's revalidation is not required to exceed what those siblings already validate, per `docs/agent-workflow/token-efficient-review-policy.md`.
