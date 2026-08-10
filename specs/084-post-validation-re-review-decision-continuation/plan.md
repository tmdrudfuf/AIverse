# Implementation Plan: Spec 084 - Post-Validation Re-Review Decision and Continuation Foundation

**Branch**: `codex/084-post-validation-re-review-decision-continuation` | **Date**: 2026-08-09 | **Spec**: `specs/084-post-validation-re-review-decision-continuation/spec.md`

## Summary

Extend coverage and, if needed, wiring around the existing Review Decision continuation boundary so post-validation re-review outcomes use the fresh post-validation Review Target. Reuse the existing ReviewDecisionService, ReviewFixRequestService, and ReviewPromotionService behavior in place; do not add new agent runtimes or remote operations.

## Technical Context

**Language/Version**: TypeScript 5.8, Next.js 16, Vitest
**Primary Dependencies**: existing PostValidationReviewTarget, Reviewer Runtime, Review Decision, Review Fix Request
**Storage**: in-memory portal state collections
**Testing**: focused Vitest regression tests plus ADOS validation outside this runtime

## Constitution Check

- Writes stay in the dedicated Spec 084 worktree.
- Product runtime does not mutate GitHub, publish, merge, deploy, push, or open PRs.
- Continuation is explicit human action only.
- Existing provider-neutral service boundaries are reused.

## Design

The current controller stores the active post-validation target in `state.reviewTargets[projectId]` when the human starts re-review. The Review Decision resolver already accepts an explicit `reviewTarget` and selects reviewer runtime/result records for that target. Spec 084 locks this behavior down with regressions for both terminal continuation paths:

- Approved post-validation re-review -> explicit Promote records a Review Promotion for the post-validation reviewer runtime.
- ChangesRequested post-validation re-review -> explicit Request Fix records a new Review Fix Request for the post-validation reviewer runtime while preserving the old pre-validation request.

Production code changes should stay minimal and only address gaps exposed by these regressions.

## Validation

Focused:

```powershell
npm test -- OfficeProjectPortalController.review-decision ReviewDecision
```

Full ADOS validation, normally required but intentionally not run from this handoff runtime:

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```
