# Implementation Plan: Spec 092 - Progression Event Feed Foundation

**Branch**: `codex/092-progression-event-feed-foundation` | **Date**: 2026-08-12 | **Spec**: `specs/092-progression-event-feed-foundation/spec.md`

**Input**: Feature specification from `/specs/092-progression-event-feed-foundation/spec.md`

## Summary

Project company progression reward records into copied event-feed entries, include those feed entries in city world-state snapshots, and carry them from the company office back to the city through the existing return payload path. This is an in-memory foundation only and introduces no visible UI.

## Technical Context

**Language/Version**: TypeScript 5.8, Next.js 16, Phaser 3.90, Vitest

**Primary Dependencies**: existing company progression reward service, office return payload, and world-state synchronizer

**Storage**: in-memory scene and payload state only

**Testing**: focused Vitest unit coverage for event conversion, world-state synchronization semantics, and payload copying; ADOS validation runs outside this runtime

**Target Platform**: browser-based AIverse app

**Project Type**: Next.js application with Phaser city/office interaction surface

**Performance Goals**: O(number of progression rewards) per office exit and world-state synchronization; no network, persistence, or subprocess work

**Constraints**: Mutate only the feature worktree. Do not run validation, start review, publish, merge, deploy, mutate GitHub, or modify the primary repository from this runtime.

**Scale/Scope**: Existing city scene, office scene, company progression rewards, and city world-state snapshot; no visible UI, persistence, event display, animations, or durable event history

## Constitution Check

- Spec exists before plan and implementation.
- Plan names affected source/test surfaces before code changes.
- Tasks will be created before implementation edits.
- Application changes stay scoped to progression feed event conversion, office return payload wiring, and world-state snapshots.
- Validation commands are documented but intentionally not run from this ADOS handoff runtime.

## Project Structure

### Documentation (this feature)

```text
specs/092-progression-event-feed-foundation/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- progression-event-feed.md
|-- checklists/
|   `-- requirements.md
`-- tasks.md
```

### Source Code (repository root)

```text
src/features/city-view/scene/
|-- CityWorldScene.ts
|-- office/
|   |-- CompanyOfficeScene.ts
|   |-- OfficeExitController.ts
|   |-- OfficeExitController.test.ts
|   `-- officeTypes.ts
`-- world-state/
    |-- CompanyProgressionEventFeedService.ts
    |-- CompanyProgressionEventFeedService.test.ts
    |-- WorldStateSynchronizer.ts
    |-- WorldStateSynchronizer.test.ts
    `-- WorldStateTypes.ts
```

**Structure Decision**: Keep event-feed shape and synchronization behavior in `world-state/`, because future consumers should observe feed entries through city world snapshots. Keep office scene and return payload changes limited to the existing city handoff path.

## Design

`CompanyProgressionEventFeedService` is stateless. It converts copied company progression rewards into copied feed event records. The world-state synchronizer accepts an optional feed event list, stores copied feed events in successful and status snapshots, includes feed events in semantic comparison, and returns copied snapshots.

The office scene converts the progression rewards it already creates during exit into feed events and attaches them to the existing city return payload. The city scene passes those payload feed events into world-state synchronization during the initial and subsequent synchronizations for that returned city session.

## Validation

Focused validation, outside this runtime:

```powershell
npm test -- CompanyProgressionEventFeedService WorldStateSynchronizer OfficeExitController
```

Full ADOS validation, outside this runtime:

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```
