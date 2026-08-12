# Implementation Plan: Spec 087 - Promotion History & Timeline Foundation

**Branch**: `codex/087-promotion-history-timeline-foundation` | **Date**: 2026-08-11 | **Spec**: `specs/087-promotion-history-timeline-foundation/spec.md`

**Input**: Feature specification from `/specs/087-promotion-history-timeline-foundation/spec.md`

## Summary

Add a read-only promotion history/timeline foundation for the office project dashboard. The existing Review Decision service already writes immutable Review Promotion records and deterministic Review Promotion Result records, so this feature derives ordered timeline events from those collections and renders a compact dashboard summary without changing promotion execution.

## Technical Context

**Language/Version**: TypeScript 5.8, Next.js 16, Vitest

**Primary Dependencies**: existing Review Decision types/service/view, Office Project Portal dashboard lower-row renderer

**Storage**: in-memory portal state collections

**Testing**: focused Vitest regression tests added to existing Review Decision controller/display coverage; ADOS validation runs outside this runtime

**Target Platform**: browser-based AIverse app

**Project Type**: Next.js application with Phaser city/office interaction surface

**Performance Goals**: Derived read model runs in one pass over per-project promotion/result collections and adds no runtime loop work

**Constraints**: Mutate only the feature worktree. Do not run validation, start review, publish, merge, deploy, mutate GitHub, or modify the primary repository from this runtime.

**Scale/Scope**: One selected project dashboard row plus derived promotion timeline helpers for current and historical review promotions

## Constitution Check

- Spec exists before plan and implementation.
- Plan names affected source/test surfaces before code changes.
- Tasks will be created before implementation edits.
- Application changes stay scoped to Review Decision history derivation and the project dashboard row.
- Validation commands are documented but intentionally not run from this ADOS handoff runtime.

## Project Structure

### Documentation (this feature)

```text
specs/087-promotion-history-timeline-foundation/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- promotion-history-timeline.md
|-- checklists/
|   `-- requirements.md
`-- tasks.md
```

### Source Code (repository root)

```text
src/features/city-view/scene/office/
|-- OfficeProjectPortalController.review-decision.test.ts
|-- OfficeProjectPortalView.ts
`-- review-decision/
    |-- ReviewDecisionTypes.ts
    |-- ReviewDecisionView.ts
    `-- ReviewPromotionTimelineView.ts
```

**Structure Decision**: Keep history derivation in the existing review-decision boundary and render only a compact dashboard row from the project dashboard surface.

## Design

Promotion history is derived from `ReviewPromotionCollection` and `ReviewPromotionResultCollection`. Promotion-backed events use immutable promotion identity and fields, while blocked result-only attempts remain visible through result records. The current event is identified by the same `findCurrentReviewPromotion` result already shared by Promote and dashboard classification. Event ordering is deterministic by timestamp and event id.

## Validation

Focused validation, outside this runtime:

```powershell
npm test -- OfficeProjectPortalController.review-decision
```

Full ADOS validation, outside this runtime:

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```
