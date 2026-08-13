# Implementation Plan: Spec 091 - Company Progression Reward Foundation

**Branch**: `codex/091-company-progression-reward-foundation` | **Date**: 2026-08-12 | **Spec**: `specs/091-company-progression-reward-foundation/spec.md`

**Input**: Feature specification from `/specs/091-company-progression-reward-foundation/spec.md`

## Summary

Project company progression world effects into copied reward records, include those rewards in city world-state snapshots, and carry them from the company office back to the city through the existing return payload path. This is an in-memory foundation only and introduces no visible UI.

## Technical Context

**Language/Version**: TypeScript 5.8, Next.js 16, Phaser 3.90, Vitest

**Primary Dependencies**: existing company progression world effect service, office return payload, and world-state synchronizer

**Storage**: in-memory scene and payload state only

**Testing**: focused Vitest unit coverage for reward conversion, world-state synchronization semantics, and payload copying; ADOS validation runs outside this runtime

**Target Platform**: browser-based AIverse app

**Project Type**: Next.js application with Phaser city/office interaction surface

**Performance Goals**: O(number of progression world effects) per office exit and world-state synchronization; no network, persistence, or subprocess work

**Constraints**: Mutate only the feature worktree. Do not run validation, start review, publish, merge, deploy, mutate GitHub, or modify the primary repository from this runtime.

**Scale/Scope**: Existing city scene, office scene, company progression world effects, and city world-state snapshot; no visible UI, persistence, reward display, animations, or durable reward history

## Constitution Check

- Spec exists before plan and implementation.
- Plan names affected source/test surfaces before code changes.
- Tasks will be created before implementation edits.
- Application changes stay scoped to progression reward conversion, office return payload wiring, and world-state snapshots.
- Validation commands are documented but intentionally not run from this ADOS handoff runtime.

## Project Structure

### Documentation (this feature)

```text
specs/091-company-progression-reward-foundation/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- company-progression-rewards.md
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
    |-- CompanyProgressionRewardService.ts
    |-- CompanyProgressionRewardService.test.ts
    |-- WorldStateSynchronizer.ts
    |-- WorldStateSynchronizer.test.ts
    `-- WorldStateTypes.ts
```

**Structure Decision**: Keep reward shape and synchronization behavior in `world-state/`, because future consumers should observe rewards through city world snapshots. Keep office scene and return payload changes limited to the existing city handoff path.

## Design

`CompanyProgressionRewardService` is stateless. It converts copied company progression world effects into copied reward records. The world-state synchronizer accepts an optional reward list, stores copied rewards in successful and status snapshots, includes rewards in semantic comparison, and returns copied snapshots.

The office scene converts the progression world effects it already creates during exit into progression rewards and attaches them to the existing city return payload. The city scene passes those payload rewards into world-state synchronization during the initial and subsequent synchronizations for that returned city session.

## Validation

Focused validation, outside this runtime:

```powershell
npm test -- CompanyProgressionRewardService WorldStateSynchronizer OfficeExitController
```

Full ADOS validation, outside this runtime:

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```
