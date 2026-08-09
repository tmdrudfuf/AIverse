# Implementation Plan: Spec 083 - Post-Validation Review Target and Re-Review Foundation

**Branch**: `codex/083-post-validation-review-foundation` | **Date**: 2026-08-08 | **Spec**: `specs/083-post-validation-review-foundation/spec.md`

## Summary

Extend the existing ReviewTarget domain with a post-validation mode and add a small service that resolves the fresh review target from a completed Validation Runtime. Reuse existing Reviewer Runtime and Review Decision services by supplying the fresh target and selecting reviewer results by target ID.

## Technical Context

**Language/Version**: TypeScript 5.8, Next.js 16, Vitest
**Primary Dependencies**: existing Validation Runtime, Review Fix Runtime, Reviewer Runtime, Review Decision
**Storage**: in-memory portal state collections
**Testing**: focused Vitest plus full ADOS validation

## Constitution Check

- All writes occur in the dedicated Spec 083 worktree.
- Product runtime does not mutate GitHub or publish.
- Re-review is explicit human action only.
- Existing Reviewer Runtime is reused; no ReviewerRuntimeV2.

## Design

`PostValidationReviewTargetService` consumes the same chain context as Validation Runtime, revalidates the current Review Fix chain, requires a completed Validation Runtime/Result with exact evidence parity, and emits a `ReviewTarget` in `source: "PostValidation"` mode. The existing Reviewer Runtime consumes that target. Review Decision resolution is updated to prefer reviewer runtime/result records matching the supplied target ID.

## Validation

Focused:

```powershell
npm test -- PostValidationReviewTarget ReviewerRuntime ReviewDecision ValidationRuntime ReviewFixRuntime OfficeActionInputController OfficeProjectPortalController.review-decision OfficeProjectPortalView
npx tsc --noEmit
```

Full:

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```
