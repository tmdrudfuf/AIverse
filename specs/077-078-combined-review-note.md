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
