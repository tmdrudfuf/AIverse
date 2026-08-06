# Implementation Plan: Review Fix Request Foundation

**Branch**: `codex/079-review-fix-request-foundation` | **Date**: 2026-08-05 | **Spec**: [spec.md](./spec.md)

## Summary

Add a sibling domain to Spec 077's Review Promotion gate: a human may explicitly request fixes when the current Review Decision is a concrete `ChangesRequested` Reviewer Runtime decision. The feature records immutable provider-neutral request/result snapshots only. It reuses the existing Review Decision classifier and Runtime Chain Integrity validator, adds per-project request/result collections, exposes a distinct controller input, and renders safe dashboard rows. It does not start Validation Runtime, Codex, Claude, subprocesses, validation commands, repository mutation, or GitHub mutation.

## Technical Context

**Language/Version**: TypeScript in the existing Next.js/Phaser application.

**Primary Dependencies**: Existing office portal services: `ReviewDecisionService`, `validateReviewRuntimeChainIntegrity`, Reviewer Runtime records/results, Runtime Chain records, ProjectTask provenance, repository metadata stored in Execution Plan, and dashboard row overflow helpers.

**Storage**: In-memory per-project `ProjectPortalState` maps, matching `reviewPromotionCollections` and `reviewPromotionResultCollections`.

**Testing**: Vitest focused unit tests for the new service and view plus controller integration tests. Full validation uses the repository standard commands.

**Target Platform**: Browser-compatible product code. No Node filesystem, process, Git, or GitHub operations in product implementation.

**Performance Goals**: Synchronous, in-memory, O(n) over the small per-project request/result arrays.

**Constraints**: Explicit human action only; no automatic fix execution; no product subprocess; no repository or GitHub mutation; no rewrite of Specs 075-078 historical records.

## Constitution Check

- Spec First: Passed. `spec.md` defines user value and acceptance criteria before implementation.
- Plan Before Code: Passed by this artifact.
- Tasks Gate Implementation: `tasks.md` will be generated before code edits.
- Preserve Application Stability: Scoped to one new domain, controller integration, registry state, dashboard rows, and tests.
- Validation Required: Focused tests during development and full validation before review.

## Project Structure

### Documentation

```text
specs/079-review-fix-request-foundation/
spec.md
plan.md
data-model.md
contracts/review-fix-request-contract.md
quickstart.md
tasks.md
checklists/requirements.md
```

### Source Code

```text
src/features/city-view/scene/office/review-fix-requests/
  ReviewFixRequestTypes.ts
  ReviewFixRequestService.ts
  ReviewFixRequestView.ts
  ReviewFixRequestService.test.ts
  ReviewFixRequestView.test.ts

src/features/city-view/scene/office/
  OfficeProjectPortalTypes.ts
  OfficeProjectPortalRegistry.ts
  OfficeProjectPortalController.ts
  OfficeProjectPortalController.review-decision.test.ts
  OfficeProjectPortalView.ts
```

## Architecture Decisions

### Decision 1 - New sibling domain, not a second reviewer or fix runner

Review Fix Request is downstream of Review Decision and upstream of any future fix execution. It records the human intent to request fixes for an exact `ChangesRequested` result. It does not alter `ReviewDecisionService.promote()` or Review Promotion semantics.

### Decision 2 - Reuse Review Decision classification and shared chain integrity

The request service calls `ReviewDecisionService.classify(input)` and accepts only `state === "ChangesRequested"` with raw `decision === "ChangesRequested"`. This preserves the existing stale-chain behavior from Spec 078 and blocks `Unknown`, `Approved`, result-only, or unavailable states.

### Decision 3 - Deterministic ID per project and Reviewer Runtime

`createReviewFixRequestId(projectId, reviewerRuntimeId)` returns `<projectId>:review-fix-request:<reviewerRuntimeId>:review-fix-request-v1`. The paired result ID uses `<projectId>:review-fix-request-result:<reviewerRuntimeId>:review-fix-request-v1`. IDs do not include timestamps, people names, or UI order.

### Decision 4 - Existing request idempotency requires exact-context comparison

An existing request returns `AlreadyRequested` only after actor validation, fresh classification, fresh chain revalidation through the classifier, and field comparison against the current chain snapshot. A historical request remains immutable, but if current context changed it does not count as current.

### Decision 5 - Distinct input action and dashboard wording

The controller adds a separate fix-request input flag. It is not shared with Promote, Reviewer Runtime start, Validation Runtime, or any navigation input. The dashboard renders `[REVIEW FIX REQUEST]` with bounded text such as `Request fixes (F); no execution` or `Fix request recorded; no execution`.

## State and Storage

Add two optional maps to `ProjectPortalState`:

- `reviewFixRequestCollections: Record<string, ReviewFixRequestCollection>`
- `reviewFixRequestResultCollections: Record<string, ReviewFixRequestResultCollection>`

The registry initializes both to `{}`. Collections defensively copy arrays and records.

## Validation Strategy

Focused validation:

- `ReviewFixRequestService.test.ts`
- `ReviewFixRequestView.test.ts`
- relevant `OfficeProjectPortalController.review-decision.test.ts` cases
- relevant dashboard rendering tests if touched

Full validation before review:

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```

## Human Approval Boundary

This spec stops after local implementation, validation, commit, and independent Claude review. Push, PR creation, Ready for Review, merge, branch deletion, and all remote GitHub mutation remain human-gated.

## Complexity Tracking

No constitution violations. One new domain module and per-project state pair mirror the existing Review Promotion pattern. No new external dependency or runtime framework.