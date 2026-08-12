# Implementation Plan: Spec 088 - World State Synchronization Foundation

**Branch**: `codex/088-world-state-synchronization-foundation` | **Date**: 2026-08-12 | **Spec**: `specs/088-world-state-synchronization-foundation/spec.md`

**Input**: Feature specification from `/specs/088-world-state-synchronization-foundation/spec.md`

## Summary

Introduce an in-memory, read-only world-state synchronization boundary for the city scene. The feature derives immutable snapshots from existing city bounds, building definitions, and Founder runtime state, then synchronizes only when semantic world facts change.

## Technical Context

**Language/Version**: TypeScript 5.8, Next.js 16, Phaser 3.90, Vitest

**Primary Dependencies**: existing city scene config, building definitions, Founder state types

**Storage**: in-memory scene service only

**Testing**: focused Vitest unit coverage for snapshot creation and synchronization semantics; ADOS validation runs outside this runtime

**Target Platform**: browser-based AIverse app

**Project Type**: Next.js application with Phaser city/office interaction surface

**Performance Goals**: One pass over configured buildings and actors per synchronization request; no network or persistence work

**Constraints**: Mutate only the feature worktree. Do not run validation, start review, publish, merge, deploy, mutate GitHub, or modify the primary repository from this runtime.

**Scale/Scope**: Existing city world scene, three configured buildings, Founder actor only; office interiors, employees, tasks, persistence, transports, and integrations are deferred

## Constitution Check

- Spec exists before plan and implementation.
- Plan names affected source/test surfaces before code changes.
- Tasks will be created before implementation edits.
- Application changes stay scoped to scene world-state synchronization and city scene wiring.
- Validation commands are documented but intentionally not run from this ADOS handoff runtime.

## Project Structure

### Documentation (this feature)

```text
specs/088-world-state-synchronization-foundation/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- world-state-synchronization.md
|-- checklists/
|   `-- requirements.md
`-- tasks.md
```

### Source Code (repository root)

```text
src/features/city-view/scene/
|-- CityWorldScene.ts
`-- world-state/
    |-- WorldStateTypes.ts
    |-- WorldStateSynchronizer.ts
    `-- WorldStateSynchronizer.test.ts
```

**Structure Decision**: Keep the foundation beside scene code because it synchronizes scene-projected world facts, but make the types and synchronizer framework-independent so future world/domain modules can consume or relocate them without pulling Phaser along.

## Design

`WorldStateSynchronizer` owns the latest in-memory `WorldStateSnapshot`. Callers provide world identity, active world-space identity, scene key, bounds, building definitions, optional Founder state, and timestamp. The synchronizer builds a copied candidate snapshot, compares semantic world facts against the previous successful snapshot, and either stores the new snapshot or returns the existing one with an unchanged result.

Runtime-only navigation velocity, keyboard intent, camera smoothing, and visual objects remain outside the snapshot.

## Validation

Focused validation, outside this runtime:

```powershell
npm test -- WorldStateSynchronizer
```

Full ADOS validation, outside this runtime:

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```
