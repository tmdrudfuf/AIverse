# Implementation Plan: Spec 093 - Progression Event Feed Visible Panel Integration

**Branch**: `codex/093-progression-event-feed-visible-panel-integration` | **Date**: 2026-08-12 | **Spec**: `specs/093-progression-event-feed-visible-panel-integration/spec.md`

**Input**: Feature specification from `/specs/093-progression-event-feed-visible-panel-integration/spec.md`

## Summary

Render the existing city world-state progression event feed as a compact fixed HUD panel in the city scene. The panel is read-only, in-memory, hidden when empty, and displays a bounded set of display-safe event summaries.

## Technical Context

**Language/Version**: TypeScript 5.8, Next.js 16, Phaser 3.90, Vitest

**Primary Dependencies**: existing `WorldStateSnapshot.eventFeed`, city `WorldStateSynchronizer`, and Phaser scene text/graphics APIs

**Storage**: in-memory scene state only

**Testing**: focused Vitest unit coverage for feed row formatting and bounded visible rows; ADOS validation runs outside this runtime

**Target Platform**: browser-based AIverse app

**Project Type**: Next.js application with Phaser city/office interaction surface

**Performance Goals**: O(number of visible feed events) per synchronization update; panel caps visible rows at three

**Constraints**: Mutate only the feature worktree. Do not run validation, start review, publish, merge, deploy, mutate GitHub, or modify the primary repository from this runtime.

**Scale/Scope**: Existing city scene and world-state feed events; no persistence, dismissal controls, filtering, notification queue, or React overlay

## Constitution Check

- Spec exists before plan and implementation.
- Plan names affected source/test surfaces before code changes.
- Tasks will be created before implementation edits.
- Application changes stay scoped to city feed panel formatting, rendering, and city scene wiring.
- Validation commands are documented but intentionally not run from this ADOS handoff runtime.

## Project Structure

### Documentation (this feature)

```text
specs/093-progression-event-feed-visible-panel-integration/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- visible-progression-feed-panel.md
|-- checklists/
|   `-- requirements.md
`-- tasks.md
```

### Source Code (repository root)

```text
src/features/city-view/scene/
|-- CityWorldScene.ts
`-- world-state/
    |-- ProgressionEventFeedPanel.ts
    |-- ProgressionEventFeedPanel.test.ts
    `-- WorldStateTypes.ts
```

**Structure Decision**: Keep the panel beside world-state feed types because it is the first visual consumer of `WorldStateSnapshot.eventFeed`. Wire it from `CityWorldScene` after synchronization so it always reads the copied snapshot returned by the synchronizer.

## Design

`ProgressionEventFeedPanel` owns Phaser display objects for a fixed top-right HUD panel. It exposes `update(snapshot?: WorldStateSnapshot)` and `destroy()`. Pure helpers build bounded display rows from `WorldEventFeedState[]`, summarizing level, stage, unlocked zones, and milestone counts with fixed row limits.

`CityWorldScene` creates the panel during scene setup, updates it with the snapshot returned by `WorldStateSynchronizer.synchronize`, and destroys it with the other scene controllers. Empty feed snapshots hide the panel and clear previous rows.

## Validation

Focused validation, outside this runtime:

```powershell
npm test -- ProgressionEventFeedPanel
```

Full ADOS validation, outside this runtime:

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```
