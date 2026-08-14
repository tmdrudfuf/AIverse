# Implementation Plan: Spec 094 - Progression Reward Presentation

**Branch**: `codex/094-progression-reward-presentation` | **Date**: 2026-08-13 | **Spec**: `specs/094-progression-reward-presentation/spec.md`

**Input**: Feature specification from `/specs/094-progression-reward-presentation/spec.md`

## Summary

Render the existing city world-state progression rewards as a compact fixed HUD presentation in the city scene. The presentation is read-only, in-memory, hidden when empty, and displays a bounded set of display-safe reward summaries without replacing the existing progression event feed panel.

## Technical Context

**Language/Version**: TypeScript 5.8, Next.js 16, Phaser 3.90, Vitest

**Primary Dependencies**: existing `WorldStateSnapshot.rewards`, city `WorldStateSynchronizer`, `CityWorldScene`, and Phaser scene text/graphics APIs

**Storage**: in-memory scene state only

**Testing**: focused Vitest unit coverage for reward row formatting and bounded visible rows; ADOS validation runs outside this runtime

**Target Platform**: browser-based AIverse app

**Project Type**: Next.js application with Phaser city/office interaction surface

**Performance Goals**: O(number of visible rewards) per synchronization update; panel caps visible rows at three

**Constraints**: Mutate only the feature worktree. Do not run validation, start review, publish, merge, deploy, mutate GitHub, or modify the primary repository from this runtime.

**Scale/Scope**: Existing city scene and world-state rewards; no persistence, dismissal controls, filtering, notification queue, animation, React overlay, or reward generation changes

## Constitution Check

- Spec exists before plan and implementation.
- Plan names affected source/test surfaces before code changes.
- Tasks will be created before implementation edits.
- Application changes stay scoped to city reward presentation formatting, rendering, and city scene wiring.
- Validation commands are documented but intentionally not run from this ADOS handoff runtime.

## Project Structure

### Documentation (this feature)

```text
specs/094-progression-reward-presentation/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- progression-reward-presentation.md
|-- checklists/
|   `-- requirements.md
`-- tasks.md
```

### Source Code (repository root)

```text
src/features/city-view/scene/
|-- CityWorldScene.ts
`-- world-state/
    |-- ProgressionRewardPresentationPanel.ts
    |-- ProgressionRewardPresentationPanel.test.ts
    `-- WorldStateTypes.ts
```

**Structure Decision**: Keep the reward presentation beside world-state reward types because it is the first visual consumer of `WorldStateSnapshot.rewards`. Wire it from `CityWorldScene` after synchronization so it always reads the copied snapshot returned by the synchronizer.

## Design

`ProgressionRewardPresentationPanel` owns Phaser display objects for a fixed top-right HUD panel placed below the existing progression event feed panel. It exposes `update(snapshot?: WorldStateSnapshot)` and `destroy()`. Pure helpers build bounded display rows from `WorldRewardState[]`, summarizing level, stage, capacity, floor count, and unlocked zones with fixed row limits.

`CityWorldScene` creates the panel during scene setup, updates it with the snapshot returned by `WorldStateSynchronizer.synchronize`, and destroys it with the other scene controllers. Empty reward snapshots hide the panel and clear previous rows.

## Validation

Focused validation, outside this runtime:

```powershell
npm test -- ProgressionRewardPresentationPanel
```

Full ADOS validation, outside this runtime:

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```
