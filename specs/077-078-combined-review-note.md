# Combined Publication Candidate: Spec 077 + Spec 078

This note does not edit or rewrite `specs/077-review-decision-human-promotion-gate/review.md`
or `specs/078-review-runtime-chain-integrity-consolidation/review.md`. Both remain exactly as
historically recorded. This file only records the relationship between them for the combined
publication candidate.

## Facts

- **Spec 077 alone remained unapproved.** Its last recorded independent review
  (`.agent-workflow/spec-077-state.json`, round 5, `recordedAt: 2026-08-03T05:42:11.455Z`)
  returned `Changes Requested` with one blocking finding, P1-001: "Review promotion accepts
  malformed Reviewer Runtime identity/result records." Spec 077's branch HEAD
  (`1cf8c2fb5d568e83df1e2f60af7e5de653f15485`) was never independently re-reviewed after that
  finding was recorded.
- **Spec 078 was created as Spec 077's stacked integrity consolidation.** Branched directly from
  Spec 077 HEAD, it extracted and completed exactly the class of gap round 5 identified — a single
  shared `ReviewRuntimeChainIntegrityService` now validates deterministic identity, `rulesVersion`,
  and full upstream-context parity for every chain record, including the Reviewer Runtime
  identity/result checks P1-001 named as missing.
- **Spec 078's own single-round review at its exact final HEAD
  (`40b29f7a00930ae6d8781329dc795c3917b6dadc`) returned Approved**, 0 blocking findings, one
  cosmetic non-blocking finding (P3-001, mojibake punctuation in docs).
- **Neither branch alone is a review-authorized publication candidate for the full accumulated
  stack.** Spec 077's own commits were never re-approved at their final HEAD; Spec 078's Approved
  review only covered the Spec 078 commit's own diff against Spec 077 HEAD, not the full diff from
  `main`.

## Combined candidate

Branch `codex/077-078-review-promotion-integrity-combined`, created directly at Spec 078's exact
HEAD, contains the complete accumulated stack (Spec 077 + Spec 078) unmodified. Only an independent
review of the full diff from the original `main` base through this combined HEAD can authorize
publication of this stack.

## Combined branch's own review rounds

- **Round 1** (`.agent-workflow/spec-077-078-combined-state.json`, `reviewRuns[0]`, recorded
  2026-08-04T07:55:29.146Z) returned `Changes Requested`, one blocking finding: the `[REVIEW
  DECISION]` dashboard's Promoted row wording did not explicitly state the no-push/no-PR/no-merge
  boundary. Fixed in commit `ab26c03389ad582854754761847b4dab9b7176b6`
  (`ReviewDecisionView.ts`/`ReviewDecisionView.test.ts`).
- **Round 2** (`reviewRuns[1]`, recorded 2026-08-05T06:57:32.199Z) re-reviewed that commit and
  returned `Changes Requested` again, with two new blocking findings and one non-blocking finding:
  - **P1-001** (`ReviewRuntimeChainIntegrityService.ts` 384-395): a `ReviewTarget`'s `baseBranch`,
    `baseSha`, and `mergeBaseSha` were only checked against each other (`mergeBaseSha !==
    baseSha`), never against the authoritative value the exact current plan/implementerRuntime
    context should have produced -- a malformed target could change `baseSha` and `mergeBaseSha`
    together and stay internally self-consistent while no longer representing the approved
    comparison base.
  - **P2-001** (`OfficeProjectPortalController.ts` 2259-2287): the dashboard resolved the current
    Execution Plan as the last element of the plans array, while `promoteReviewForPromotion`
    resolved it as the first array match on `projectTaskId`/`candidateTaskId` -- with multiple
    plans for the same promoted task/candidate, those two selections could diverge.
  - **N-001** (P3, non-blocking): cosmetic mojibake punctuation in Spec 078's `spec.md`. Left
    untouched per this fix cycle's explicit scope (not naturally touched by the P1-001/P2-001
    lines).

### Round 2 fixes (this consolidated fix cycle)

- **ReviewTarget base-context policy**: `ReviewTarget.ts` now exports the authoritative formula
  pieces `REVIEW_TARGET_BASE_BRANCH`, `computeReviewTargetBaseSha(projectId, planId)`, and
  `computeReviewTargetSha(implementerRuntimeId)`; `resolveReviewTarget` is refactored to call
  them (single source of truth) instead of inlining the hash calls. `validateReviewTarget` in
  `ReviewRuntimeChainIntegrityService.ts` recomputes all three from the current
  plan/implementerRuntime context and rejects any `ReviewTarget` whose `baseBranch`, `baseSha`,
  `mergeBaseSha`, or `reviewTargetSha` diverges from that authoritative recomputation -- not
  merely from each other.
- **Shared Execution Plan resolver policy**: `ExecutionPlanTypes.ts` exports
  `resolveCurrentExecutionPlan(planCollection, filter?)`, which selects the plan with the latest
  `createdAt` (explicit domain data, not array order) among any plans matching an optional
  `projectTaskId`/`candidateTaskId` filter, tie-broken by `planId`. `OfficeProjectPortalController.ts`'s
  `promoteReviewForPromotion` was already task/candidate-scoped, so it now passes that same filter
  through the shared resolver. `OfficeProjectPortalView.ts`'s dashboard render previously passed no
  filter at all (picking the *project's* newest plan regardless of task), which would still let it
  diverge from Promote whenever a project has plans for more than one task/candidate concurrently --
  so the dashboard render was also changed to derive the same selected candidate/project task
  Promote would act on (via `state.selectedCandidatePromotionIndex` and the same
  `parsePromotedProjectTaskProvenance`-based task lookup `promoteReviewForPromotion` already used)
  and pass it as the identical filter, falling back to unfiltered only when nothing is selected yet.
  Both call sites now resolve the exact same plan for the exact same selection, not merely the same
  plan when only one task happens to have plans.
- **Tests added**: `ReviewRuntimeChainIntegrityService.test.ts` (base-context binding, 6 cases),
  `ReviewDecisionService.test.ts` (promote-level block on a tampered target),
  `OfficeProjectPortalController.review-decision.test.ts` (dashboard/Promote parity with a stale
  same-task decoy plan, plus cross-task isolation when a *different* task has a newer plan),
  `ExecutionPlanTypes.test.ts` (`resolveCurrentExecutionPlan`, 8 cases).
