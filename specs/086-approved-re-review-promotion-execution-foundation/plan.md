# Implementation Plan: Spec 086 - Approved Re-Review Promotion Execution Foundation

**Branch**: `codex/086-approved-re-review-promotion-execution-foundation` | **Date**: 2026-08-10 | **Spec**: `specs/086-approved-re-review-promotion-execution-foundation/spec.md`

**Input**: Feature specification from `/specs/086-approved-re-review-promotion-execution-foundation/spec.md`

## Summary

Lock down execution of the explicit Promote action after an Approved post-validation re-review. The existing controller and Review Decision service already record Review Promotions through the same human-triggered path used for original reviewer runtimes, so implementation focuses on regression coverage that proves the post-validation promotion result is granted, idempotent, and side-effect free.

## Technical Context

**Language/Version**: TypeScript 5.8, Next.js 16, Vitest

**Primary Dependencies**: existing PostValidationReviewTarget, Reviewer Runtime, Review Decision, Review Promotion, Office Project Portal controller/view

**Storage**: in-memory portal state collections

**Testing**: focused Vitest regression tests plus ADOS validation outside this runtime

**Target Platform**: browser-based AIverse app

**Project Type**: Next.js application with Phaser city/office interaction surface

**Performance Goals**: No additional runtime loop work; promotion execution remains one human input handling pass

**Constraints**: Do not run validation, start review, publish, merge, deploy, mutate GitHub, or modify the primary repository from this runtime

**Scale/Scope**: One continuation path for the selected project/candidate task in the office project portal

## Constitution Check

- Spec exists before plan and implementation.
- Plan names the affected source/test surfaces before code changes.
- Tasks will be created before implementation edits.
- Application changes stay scoped to Review Decision controller regression coverage unless a failing regression exposes a production gap.
- Validation commands are documented but intentionally not run from this ADOS handoff runtime.

## Project Structure

### Documentation (this feature)

```text
specs/086-approved-re-review-promotion-execution-foundation/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- approved-re-review-promotion-execution.md
`-- tasks.md
```

### Source Code (repository root)

```text
src/features/city-view/scene/office/
|-- OfficeProjectPortalController.review-decision.test.ts
|-- OfficeProjectPortalController.ts
`-- review-decision/
    |-- ReviewDecisionService.ts
    `-- ReviewDecisionTypes.ts
```

**Structure Decision**: Reuse the existing office review-decision controller test and production services. No new module or dependency is planned.

## Design

The controller's `promoteReviewForPromotion` path resolves the current execution plan, assembles `ReviewDecisionInput` with the active `state.reviewTargets[projectId]`, and delegates promotion recording to `ReviewDecisionService.promote`. After post-validation re-review starts, that active target is the post-validation target. A focused regression should assert the created promotion result and promotion record both point to the fresh reviewer runtime, repeated Promote remains idempotent, and all surrounding execution collections remain unchanged by Promote.

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
