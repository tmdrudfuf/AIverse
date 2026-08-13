# Implementation Plan: Spec 089 - Company Progression Trigger Foundation

**Branch**: `codex/089-company-progression-trigger-foundation` | **Date**: 2026-08-12 | **Spec**: `specs/089-company-progression-trigger-foundation/spec.md`

**Input**: Feature specification from `/specs/089-company-progression-trigger-foundation/spec.md`

## Summary

Add a small in-memory trigger boundary around existing company progression snapshots. A new progression trigger service compares previous and current snapshots, emits copied level-up trigger records for each newly reached level, and the office portal stores the latest computed triggers when refreshing company dashboard data.

## Technical Context

**Language/Version**: TypeScript 5.8, Next.js 16, Phaser 3.90, Vitest

**Primary Dependencies**: existing company progression service and office portal state

**Storage**: in-memory portal state only

**Testing**: focused Vitest unit coverage for trigger evaluation and state copying; ADOS validation runs outside this runtime

**Target Platform**: browser-based AIverse app

**Project Type**: Next.js application with Phaser city/office interaction surface

**Performance Goals**: O(number of company levels) per dashboard refresh; no network, persistence, or subprocess work

**Constraints**: Mutate only the feature worktree. Do not run validation, start review, publish, merge, deploy, mutate GitHub, or modify the primary repository from this runtime.

**Scale/Scope**: Four existing company progression levels and current office portal state; no visible UI changes

## Constitution Check

- Spec exists before plan and implementation.
- Plan names affected source/test surfaces before code changes.
- Tasks will be created before implementation edits.
- Application changes stay scoped to company progression trigger foundation and portal state wiring.
- Validation commands are documented but intentionally not run from this ADOS handoff runtime.

## Project Structure

### Documentation (this feature)

```text
specs/089-company-progression-trigger-foundation/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- company-progression-triggers.md
`-- tasks.md
```

### Source Code (repository root)

```text
src/features/city-view/scene/office/
|-- OfficeProjectPortalController.ts
|-- OfficeProjectPortalRegistry.ts
|-- OfficeProjectPortalTypes.ts
`-- progression/
    |-- CompanyProgressionTriggerService.ts
    |-- CompanyProgressionTriggerService.test.ts
    `-- CompanyProgressionTypes.ts
```

**Structure Decision**: Keep trigger evaluation beside the existing progression service because it depends on progression snapshots and milestone semantics, while portal state wiring remains in the existing controller/registry/type files.

## Design

`CompanyProgressionTriggerService` is stateless. It receives a previous snapshot, a current snapshot, and all snapshots for newly reached levels. It returns no triggers for initialization, unchanged levels, or regression. For upward transitions, it returns one copied trigger per reached level in ascending order.

The controller stores the previous progression snapshot before dashboard refresh, computes the current snapshot once, evaluates triggers, and writes the copied trigger list to `ProjectPortalState.companyProgressionTriggers`.

## Validation

Focused validation, outside this runtime:

```powershell
npm test -- CompanyProgressionTriggerService
```

Full ADOS validation, outside this runtime:

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```
