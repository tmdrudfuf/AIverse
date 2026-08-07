# Implementation Plan: Review Fix Plan Foundation

**Branch**: `codex/080-review-fix-plan-foundation` | **Date**: 2026-08-06 | **Spec**: [spec.md](./spec.md)

## Summary

Add a provider-neutral Review Fix Plan layer downstream of Spec 079's Review Fix Request. A human may explicitly plan fixes for the exact current `ChangesRequested` review-fix request context. The feature records immutable plan/result snapshots, reuses the Review Decision classifier and Review Fix Request exact-context boundary, adds per-project plan/result collections, exposes a distinct controller input, and renders safe dashboard rows. It does not start Validation Runtime, Codex, Claude, subprocesses, validation commands, repository mutation, GitHub mutation, or automatic fix execution.

## Technical Context

**Language/Version**: TypeScript in the existing Next.js/Phaser application.

**Primary Dependencies**: Existing office portal services: `ReviewDecisionService`, `ReviewFixRequestService`, Reviewer Runtime records/results, Runtime Chain Integrity, ProjectTask provenance, repository metadata stored in Execution Plan, and dashboard row overflow helpers.

**Storage**: In-memory per-project `ProjectPortalState` maps, matching `reviewFixRequestCollections` and `reviewPromotionCollections`.

**Testing**: Vitest focused unit tests for the new domain and dashboard rows plus controller integration tests. Full validation uses the repository standard commands.

**Target Platform**: Browser-compatible product code. No Node filesystem, process, Git, or GitHub operations in product implementation.

**Project Type**: Next.js web application with Phaser scene state.

**Performance Goals**: Synchronous, in-memory, O(n) over the small per-project plan/result arrays.

**Constraints**: Explicit human action only; no automatic fix execution; no product subprocess; no repository or GitHub mutation; no rewrite of Specs 075-079 historical records.

**Scale/Scope**: One new domain module, two per-project state maps, controller input routing, dashboard rows, focused tests, and Spec Kit documentation.

## Constitution Check

- Spec First: Passed. `spec.md` defines user value and acceptance criteria before implementation.
- Plan Before Code: Passed by this artifact.
- Tasks Gate Implementation: `tasks.md` will be generated before code edits.
- Preserve Application Stability: Scoped to one new domain, controller integration, registry state, dashboard rows, and tests.
- Validation Required: Focused tests during development and full validation before review.

## Project Structure

### Documentation

```text
specs/080-review-fix-plan-foundation/
spec.md
plan.md
research.md
data-model.md
contracts/review-fix-plan-contract.md
quickstart.md
tasks.md
checklists/requirements.md
```

### Source Code

```text
src/features/city-view/scene/office/review-fix-plans/
  ReviewFixPlanTypes.ts
  ReviewFixPlanService.ts
  ReviewFixPlanView.ts
  ReviewFixPlanTypes.test.ts
  ReviewFixPlanService.test.ts
  ReviewFixPlanView.test.ts

src/features/city-view/scene/office/
  OfficeProjectPortalTypes.ts
  OfficeProjectPortalRegistry.ts
  OfficeProjectPortalController.ts
  OfficeProjectPortalController.review-decision.test.ts
  OfficeActionInputController.ts
  OfficeActionInputController.test.ts
  OfficeProjectPortalView.ts
```

## Architecture Decisions

### Decision 1 - New downstream plan domain, not a fix runner

Review Fix Plan is downstream of Review Fix Request and upstream of any future fix execution or Validation Runtime. It records the exact context that would later be needed to execute fixes, but it starts no agent and mutates no repository state.

### Decision 2 - Reuse Review Fix Request and Review Decision validation

The plan service uses `ReviewFixRequestService.requestFixes()` for command-time request revalidation and only continues when the current outcome is `Requested` or `AlreadyRequested` for the same request ID. This preserves Spec 079's actor validation, chain integrity, exact-context binding, and stale-state blocking instead of duplicating those rules.

### Decision 3 - Deterministic ID per project and Review Fix Request

`createReviewFixPlanId(projectId, reviewFixRequestId)` returns `<projectId>:review-fix-plan:<reviewFixRequestId>:review-fix-plan-v1`. Result IDs use `<projectId>:review-fix-plan-result:<reviewFixRequestId>:review-fix-plan-v1`. IDs do not include timestamps, people names, process data, or UI order.

### Decision 4 - Existing plan idempotency requires exact-context comparison

An existing plan returns `AlreadyPlanned` only after human actor validation, fresh Review Fix Request revalidation, fresh review decision chain revalidation through the reused service, and field comparison against the current request snapshot. A historical plan remains immutable, but it is not considered current when any bound field changes.

### Decision 5 - Distinct input action and dashboard wording

The controller adds a separate plan-fixes input flag. It is not shared with Request Fixes, Promote, Reviewer Runtime start, Validation Runtime, or navigation input. The dashboard renders `[REVIEW FIX PLAN]` with bounded text such as `Plan fixes (G); no execution` or `Fix plan recorded; no execution`.

## State and Storage

Add two optional maps to `ProjectPortalState`:

- `reviewFixPlanCollections: Record<string, ReviewFixPlanCollection>`
- `reviewFixPlanResultCollections: Record<string, ReviewFixPlanResultCollection>`

The registry initializes both to `{}`. Collections defensively copy arrays and records.

## Validation Strategy

Focused validation:

- `ReviewFixPlanTypes.test.ts`
- `ReviewFixPlanService.test.ts`
- `ReviewFixPlanView.test.ts`
- relevant `OfficeProjectPortalController.review-decision.test.ts` cases
- `OfficeActionInputController.test.ts`

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

No constitution violations. One new domain module and per-project state pair mirror the existing Review Fix Request and Review Promotion patterns. No new external dependency or runtime framework.
