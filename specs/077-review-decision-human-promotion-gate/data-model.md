# Data Model: Review Decision Human Promotion Gate

## ReviewDecisionState

`"Unavailable" | "Blocked" | "TimedOut" | "Failed" | "ChangesRequested" | "Approved" | "Stale"` — derived, never persisted (see plan.md, Architecture Decision 1). Computed fresh from the current Reviewer Runtime record/result and a full chain revalidation on every read.

Mapping from Reviewer Runtime state:

- No Reviewer Runtime attempt exists for the current chain → `Unavailable`.
- A Reviewer Runtime exists but the upstream chain (plan/readiness/approval/preflight/Runtime Start/Implementer Runtime/role binding) no longer revalidates identically to what it was built from → `Stale` (regardless of what the Reviewer Runtime's own status/decision were).
- Reviewer Runtime `status: "Blocked"` → `Blocked`.
- Reviewer Runtime `status: "TimedOut"` → `TimedOut`.
- Reviewer Runtime `status: "Failed"` → `Failed`.
- Reviewer Runtime `status: "Completed"`, `decision: "ChangesRequested"` or `"Unknown"` → `ChangesRequested`.
- Reviewer Runtime `status: "Completed"`, `decision: "Approved"`, chain unstale → `Approved`.

## ReviewPromotionReasonCode

`REVIEW_PROMOTION_*`-prefixed, mirroring the Reviewer Runtime's (076) and Implementer Runtime's (075) prefixed convention:

- `REVIEW_PROMOTION_GRANTED` (success)
- `REVIEW_PROMOTION_ALREADY_PROMOTED` (idempotent short-circuit; not a block — returns the existing record)
- `REVIEW_PROMOTION_PLAN_INVALID`
- `REVIEW_PROMOTION_READINESS_NOT_READY`
- `REVIEW_PROMOTION_APPROVAL_STALE`
- `REVIEW_PROMOTION_PREFLIGHT_NOT_READY`
- `REVIEW_PROMOTION_START_STALE`
- `REVIEW_PROMOTION_IMPLEMENTER_MISSING`
- `REVIEW_PROMOTION_IMPLEMENTER_NOT_COMPLETED`
- `REVIEW_PROMOTION_REVIEWER_MISSING`
- `REVIEW_PROMOTION_REVIEWER_NOT_COMPLETED` (chain-parity mismatch between a Reviewer Runtime and its own Result only — see Round 8 P2-001 below; no longer used for a truthful Blocked/TimedOut/Failed status)
- `REVIEW_PROMOTION_REVIEWER_BLOCKED` (added Round 8, P2-001)
- `REVIEW_PROMOTION_REVIEWER_TIMED_OUT` (added Round 8, P2-001)
- `REVIEW_PROMOTION_REVIEWER_FAILED` (added Round 8, P2-001)
- `REVIEW_PROMOTION_REVIEWER_DECISION_UNKNOWN` (added Round 8, P2-001; a Completed run whose decision came back `"Unknown"`, distinct from a genuine `"ChangesRequested"` decision)
- `REVIEW_PROMOTION_DECISION_NOT_APPROVED` (a genuine reviewer `"ChangesRequested"` decision only, as of Round 8 P2-001)
- `REVIEW_PROMOTION_REVIEWER_STALE`
- `REVIEW_PROMOTION_ROLE_MISMATCH`
- `REVIEW_PROMOTION_TARGET_MISMATCH`
- `REVIEW_PROMOTION_INVALID_ACTOR`
- `REVIEW_PROMOTION_INTERNAL_FAILURE`

## ReviewPromotionRequest

Explicit human request, not derived from any dashboard render:

- `projectId: string`
- `reviewerRuntimeId: string` (the exact Reviewer Runtime being promoted)
- `actor: string` (must be a human label; rejected if it matches Claude/Codex/agent/bot/automation/workflow)
- `requestedAt: string`

## ReviewPromotion

- `reviewPromotionId: string`, deterministic: `<projectId>:review-promotion:<reviewerRuntimeId>:<rulesVersion>`
- `projectId`, `planId`, `runtimeStartId`, `implementerRuntimeId`, `reviewerRuntimeId`, `reviewTargetId`
- `worktreePath`, `branch`, `repositoryId`
- `implementer`, `reviewer` (generic pipeline role labels, carried forward unchanged for consistency checks)
- `approvedImplementerAgent`, `approvedReviewerAgent`
- `decision: "Approved"` (literal — a `ReviewPromotion` can only ever exist for an Approved decision)
- `promotedBy: string`, `promotedAt: string`
- `validationStarted: false`, `repositoryMutationStarted: false`, `githubMutationStarted: false` (literal types, mirroring every prior stage's safety-flag convention)
- `rulesVersion: string`

## ReviewPromotionResult

- `id`, `projectId`, `reviewerRuntimeId?`, `reviewPromotionId?`
- `granted: boolean`
- `reasonCodes: ReviewPromotionReasonCode[]`
- `alreadyPromoted: boolean` (true only on the idempotent-repeat path)
- `validationStarted: false`, `repositoryMutationStarted: false`, `githubMutationStarted: false`
- `resultAt: string`, `rulesVersion: string`

## Validation Rules

- Plan, readiness, approval, preflight, Runtime Start, and Implementer Runtime must all match the same project and exact context (reused, unmodified, from the existing chain `ReviewerRuntimeService.validateContext` already validates).
- The Reviewer Runtime must exist, match the project, and be exactly `Completed` with `decision: "Approved"`; anything else blocks with a status-specific reason (Round 8 P2-001): `REVIEW_PROMOTION_REVIEWER_BLOCKED`, `REVIEW_PROMOTION_REVIEWER_TIMED_OUT`, `REVIEW_PROMOTION_REVIEWER_FAILED`, `REVIEW_PROMOTION_DECISION_NOT_APPROVED` (genuine `ChangesRequested`), `REVIEW_PROMOTION_REVIEWER_DECISION_UNKNOWN` (`Completed` with decision `Unknown`), or `REVIEW_PROMOTION_REVIEWER_MISSING` (no attempt at all). No failure-like or Unknown-decision state ever maps to Approved.
- A Reviewer Runtime whose upstream chain no longer revalidates identically to what it was built from blocks with `REVIEW_PROMOTION_REVIEWER_STALE`, even if its own recorded decision was `Approved`.
- `approvedImplementerAgent` must equal `"claude"`, `approvedReviewerAgent` must equal `"codex"`, matching the exact values already recorded on the Reviewer Runtime — this feature does not re-derive the binding independently, it re-checks the same one Spec 076 already validated remains unchanged.
- Actor must be a human label and must not be Claude, Codex, agent, bot, automation, or workflow. As of Round 8 (P2-002), actor validation runs *before* the existing-promotion idempotency short-circuit below, for both first-time and repeated requests — an invalid actor never receives `granted: true` merely because a valid promotion already exists, and never mutates or deletes that existing promotion.
- A Review Promotion already recorded for the exact `reviewerRuntimeId` short-circuits to `REVIEW_PROMOTION_ALREADY_PROMOTED`, returning the existing record — no second record, no re-invocation of anything. This path is only reached once the requesting actor has already validated.
- `validationStarted`, `repositoryMutationStarted`, and `githubMutationStarted` are `false` on every record and result, unconditionally, with no code path that ever sets them otherwise (this feature performs no validation run and no mutation of any kind).
