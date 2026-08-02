# Human Promotion Contract

## Purpose

Defines the exact preconditions, idempotency behavior, and non-actions of `ReviewDecisionService.promote`, the sole state-changing operation this feature introduces.

## Input Boundary

`promote(request: ReviewPromotionRequest)` requires:

- `projectId`, `reviewerRuntimeId` — the exact Reviewer Runtime being promoted, not merely "the current one" resolved implicitly; a caller must name the exact record.
- `actor` — a human-readable label, checked against the same `codex|claude|agent|bot|automation|workflow` rejection pattern every prior stage uses.

## Preconditions (checked in order, every call, no caching)

1. `ReviewDecisionService.classify` for the given `projectId` is called fresh; if the resulting `reviewerRuntimeId` does not match the request's `reviewerRuntimeId`, block with `REVIEW_PROMOTION_TARGET_MISMATCH`.
2. If the classification is not exactly `Approved`, block with a truthful, status-specific reason (Round 8 P2-001): `REVIEW_PROMOTION_REVIEWER_MISSING` (`Unavailable`), `REVIEW_PROMOTION_REVIEWER_STALE` (`Stale`), `REVIEW_PROMOTION_REVIEWER_BLOCKED`, `REVIEW_PROMOTION_REVIEWER_TIMED_OUT`, `REVIEW_PROMOTION_REVIEWER_FAILED`, `REVIEW_PROMOTION_DECISION_NOT_APPROVED` (a genuine `ChangesRequested` decision), or `REVIEW_PROMOTION_REVIEWER_DECISION_UNKNOWN` (`Completed` with decision `Unknown`). None of these ever maps to Approved.
3. If the actor is not a valid human label, block with `REVIEW_PROMOTION_INVALID_ACTOR`. Checked before precondition 4 (Round 8 P2-002) — an invalid actor can never receive `granted: true` merely because a valid promotion already exists, for both first-time and repeated requests, and never mutates or deletes any existing `ReviewPromotion`.
4. If a `ReviewPromotion` already exists for the deterministic id derived from this exact `reviewerRuntimeId`, return it unchanged with `REVIEW_PROMOTION_ALREADY_PROMOTED` and `alreadyPromoted: true` — no new record, no re-validation side effect beyond the checks already performed, no provider invocation. Only reachable once the actor has already validated.

Only if every precondition passes does `promote` construct and store a new `ReviewPromotion` record.

## Output Boundary

`promote` returns exactly one `ReviewPromotionResult`, with `granted: true` only when a `ReviewPromotion` was created or an identical already-existing one was returned idempotently, and `granted: false` for every blocked precondition. The result never includes raw process output, since this operation never invokes a process.

## Idempotency

Calling `promote` twice with the same `projectId`/`reviewerRuntimeId` produces the same `reviewPromotionId` both times; the second call is a pure read of the first call's record, not a second write.

## Non-Actions (explicit)

`promote`, under every circumstance including success, MUST NOT:

- Invoke Claude or Codex, or start/restart any Implementer or Reviewer Runtime attempt.
- Run a Validation stage (none exists yet in this repository).
- Stage files, commit, push, create or update a PR, mark a PR ready, merge, or perform any other GitHub mutation.
- Set `validationStarted`, `repositoryMutationStarted`, or `githubMutationStarted` to anything other than `false`.

A `ReviewPromotion` record is a durable statement that a human looked at an exact Approved review and acknowledged it — nothing more.
