# Review: 077-review-decision-human-promotion-gate

**Reviewed commit (round 2, final)**: `d9f04f2`
**Decision**: Approved

Two independent review rounds were run via `tools/agent-workflow` (Implementer = Claude CLI, actually used as the fallback for the assigned Codex CLI role per this feature's governing directive; Reviewer = Claude CLI, per `AGENTS.md`/`CLAUDE.md` role assignment). Round 1 surfaced one genuine P1 (blocking) defect and two non-blocking findings, all fixed or triaged below; round 2 re-reviewed the fix commit and confirmed both fixes resolved with no new blocking findings, returning **Approved**.

## Round-by-round history

| Round | Reviewed commit | Outcome | Notes |
|---|---|---|---|
| 1 (attempt 1) | `d3a092c` | Timed Out | 480000ms timeout exceeded; not a code finding, matches Spec 076 round-1 precedent. Retried with `--timeout-ms 900000`. |
| 1 (attempt 2) | `d3a092c` | Changes Requested | See findings below. P1-001 fixed in `d9f04f2`; P2-001 fixed in `d9f04f2`; P3-001 accepted as residual risk (documented below). |
| 2 | `d9f04f2` | Approved | Both round-1 findings confirmed resolved against their governing contracts; no new blocking findings. Three new low-severity notes surfaced (N-001, N-002, tautological-check note) — see below. |

## Blocking Findings

### Round 1 (commit `d3a092c`) — fixed in `d9f04f2`
- **P1-001** — `OfficeProjectPortalView.ts:348-357`: the `[REVIEW DECISION]` dashboard row was built by `createReviewDecisionDisplayRows` from only the latest `ReviewerRuntimeResult` and `ReviewPromotionCollection`, never calling `ReviewDecisionService.classify` or revalidating the plan/readiness/approval/preflight/runtimeStart/implementerRuntime chain. This contradicted `plan.md` and `contracts/review-decision-contract.md`, which require the dashboard render and the Promote precondition to read the identical classification, and could show a confident "Approved; Promote (P)" row on a chain `classify()` would have reported as Stale. **Fixed**: extracted `resolveReviewDecisionInput` in `ReviewDecisionService.ts` as the single shared assembly of `ReviewDecisionInput` from raw per-project stage collections; both `OfficeProjectPortalController.promoteReviewForPromotion` and `OfficeProjectPortalView.render` now call it and pass the result to `ReviewDecisionService.classify`, so the dashboard and the Promote precondition always classify from the same input. `ReviewDecisionView.createReviewDecisionDisplayRows` now takes a `ReviewDecisionClassification` directly instead of re-deriving its own narrower check from a raw `ReviewerRuntimeResultCollection`. Added regression coverage in `ReviewDecisionView.test.ts` for the Stale-classification and promotion-gone-stale cases.

  Deviated from the reviewer's literal `recommendation` (have the Controller compute `classify()` once and thread the result into `render()`): that would require changing `render(state)`'s signature across ~50 existing call sites, or introducing a "controller precomputes into state" pattern with no precedent elsewhere in the codebase. Every other dashboard row is instead computed by the View itself, purely from `state`, at render time (the "latest per project" pattern). Having the View call `classify()` directly follows that same existing pattern and fully satisfies the finding's substance (classify() must back the dashboard, using the same shared assembly as Promote) with a smaller, more consistent diff.

## Non-Blocking Findings

### Round 1 (commit `d3a092c`)
- **P2-001** (fixed in `d9f04f2`) — `ReviewDecisionService.ts:220-350`: `validateChain` never compared `runtimeStart.repositoryId`, `implementerRuntime.repositoryId`, or `reviewTarget.repositoryId` against the current `plan.repositoryId`, unlike `ReviewerRuntimeService.validateContext`'s equivalent checks. Verified as a genuine parity gap (not a rejectable repo-wide-generalization request): grepped `ReviewerRuntimeService.validateContext` and confirmed it performs exactly this three-point `repositoryId` check (lines 316, 337, 416), and `validateChain`'s own docstring explicitly claims to mirror that function field-by-field. **Fixed**: added the three matching `repositoryId !== plan.repositoryId` checks, returning the same reason codes (`REVIEW_PROMOTION_START_STALE`, `REVIEW_PROMOTION_IMPLEMENTER_NOT_COMPLETED`, `REVIEW_PROMOTION_TARGET_MISMATCH`) already used by the adjacent checks for those same records. Added three regression tests in `ReviewDecisionService.test.ts` (`describe("Stale ...")` block), one per check.
- **P3-001** (accepted as residual risk, not fixed) — `OfficeProjectPortalController.ts:2246-2320`: `promoteReviewForPromotion` returns `true` regardless of `outcome.result.granted`, and the dashboard never surfaces a blocked promote attempt's reason code to the human. The reviewer's own `recommendation` explicitly frames this as "a follow-up UX improvement," not a defect in the feature's contract — the block itself is already correctly enforced by `promote()` and durably recorded in `reviewPromotionResultCollections`; only the inline reason-code readout is missing. Implementing it now would grow the dashboard row's contract and test surface beyond what this round's P1/P2 fixes required, in tension with this feature's explicit "do not broaden this feature into a general workflow engine" constraint. See Residual Risks below.

### Round 2 (commit `d9f04f2`) — Approved, no blocking findings

Confirmed both round-1 fixes resolved against their governing contracts (dashboard now shares `resolveReviewDecisionInput`/`classify()` with the Promote precondition; `validateChain` now matches `ReviewerRuntimeService.validateContext`'s `repositoryId` parity checks), with matching regression tests verified present. Full changed-file inventory (30 files) inspected; validation gate (`vitest`, `tsc --noEmit`, `npm run build`, `git diff --check`) clean; no push/PR/merge/GitHub-mutation/provider-invocation occurred during the review. Three new low-severity notes surfaced, all accepted as residual risk / no action:

- **N-001** — `REVIEW_PROMOTION_REVIEWER_MISSING` (`ReviewDecisionTypes.ts`) is unreachable from either call site: `classify()` short-circuits to `Unavailable` before `validateChain` runs when `reviewerRuntime` is absent, and `promote()`'s precondition 1 always intercepts with `TARGET_MISMATCH` first in that same case. Harmless defensive code; no test exercises it as an outcome. **Accepted, no action** — removing it is a pure cleanup with no behavioral effect, out of scope for this pass.
- **N-002** — `tasks.md` T015 described the pre-fix signature of `createReviewDecisionDisplayRows`. **Fixed**: T015's note updated to describe the actual post-fix signature (`ReviewDecisionClassification`, not `ReviewerRuntimeResultCollection`).
- **Tautological target-mismatch note** (not a defect) — `promoteReviewForPromotion` builds `request.reviewerRuntimeId` from the same `input.reviewerRuntime` that `promote()` immediately re-classifies against, so `TARGET_MISMATCH` can't fire through this exact call path; the check remains genuinely load-bearing at the service level via direct/independent test calls. **No action needed.**

## Suggestions

- None outstanding beyond the accepted residual risks below.

## Residual Risks

- **Blocked-promote feedback (P3-001)**: a human pressing `P` on a Stale/blocked review sees no inline reason code distinguishing "blocked" from any other no-op; the reason is recorded in `reviewPromotionResultCollections` but not surfaced in the dashboard row. Low severity (P3, explicitly framed by the reviewer as a follow-up UX improvement, not a contract violation, confirmed unchanged and still non-blocking in round 2); a future pass could surface `outcome.result.reasonCodes` in the `[REVIEW DECISION]` row when `granted` is false.
- **Unreachable `REVIEW_PROMOTION_REVIEWER_MISSING` reason code (N-001)**: dead code, harmless, confirmed unreachable from both `classify()` and `promote()`'s actual control flow. A future cleanup could remove it or annotate it as intentionally unreachable defensive code.
