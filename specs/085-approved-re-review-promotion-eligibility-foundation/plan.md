# Implementation Plan: Spec 085 - Approved Re-Review Promotion Eligibility Foundation

**Branch**: `codex/085-approved-re-review-promotion-eligibility-foundation` | **Date**: 2026-08-09 | **Spec**: `specs/085-approved-re-review-promotion-eligibility-foundation/spec.md`

**Input**: Feature specification from `/specs/085-approved-re-review-promotion-eligibility-foundation/spec.md`

## Summary

Lock down promotion eligibility after an Approved post-validation re-review. The existing Review Decision resolver and current-promotion selector already key current eligibility to the active review target and reviewer runtime, so implementation should focus on regression coverage and only change production code if the regression exposes a gap.

## Technical Context

**Language/Version**: TypeScript 5.8, Next.js 16, Vitest

**Primary Dependencies**: existing PostValidationReviewTarget, Reviewer Runtime, Review Decision, Review Promotion, Office Project Portal controller/view

**Storage**: in-memory portal state collections

**Testing**: focused Vitest regression tests plus ADOS validation outside this runtime

**Target Platform**: browser-based AIverse app

**Project Type**: Next.js application with Phaser city/office interaction surface

**Performance Goals**: No new runtime loop work beyond existing dashboard classification and promotion input handling

**Constraints**: No automatic validation, repository mutation, GitHub mutation, push, PR, merge, deployment, or publication

**Scale/Scope**: One continuation path for the selected project/candidate task in the office project portal

## Constitution Check

- Spec exists before plan and implementation.
- Plan names affected surfaces before code changes.
- Tasks will be created before implementation edits.
- Application changes stay scoped to review decision and portal regression coverage.
- Validation commands are documented but intentionally not run from this ADOS handoff runtime.

## Project Structure

### Documentation (this feature)

```text
specs/085-approved-re-review-promotion-eligibility-foundation/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- approved-re-review-promotion-eligibility.md
`-- tasks.md
```

### Source Code (repository root)

```text
src/features/city-view/scene/office/
|-- OfficeProjectPortalController.review-decision.test.ts
|-- OfficeProjectPortalController.ts
|-- OfficeProjectPortalView.ts
`-- review-decision/
    |-- ReviewDecisionService.ts
    `-- ReviewDecisionView.ts
```

**Structure Decision**: Reuse existing office review-decision services and controller tests. No new feature module or dependency is planned.

## Design

The active post-validation review target is stored in `state.reviewTargets[projectId]` when the human starts the post-validation re-review. `resolveReviewDecisionInput` receives that target and selects the reviewer runtime/result matching it. `findCurrentReviewPromotion` then resolves "already promoted" only for the freshly classified Approved reviewer runtime. A regression should prove this remains true even if a historical promotion exists for the same project.

## Validation

Focused validation, outside this runtime:

```powershell
npm test -- OfficeProjectPortalController.review-decision ReviewDecision
```

Full ADOS validation, outside this runtime:

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```
