# Implementation Plan: Spec 090 - Company Progression World Effect Foundation

**Branch**: `codex/090-company-progression-world-effect-foundation` | **Date**: 2026-08-12 | **Spec**: `specs/090-company-progression-world-effect-foundation/spec.md`

**Input**: Feature specification from `/specs/090-company-progression-world-effect-foundation/spec.md`

## Summary

Project company progression level-up triggers into copied world effects, include those effects in city world-state snapshots, and carry them from the company office back to the city through the existing return payload path. This is an in-memory foundation only and introduces no visible UI.

## Technical Context

**Language/Version**: TypeScript 5.8, Next.js 16, Phaser 3.90, Vitest

**Primary Dependencies**: existing company progression trigger service, office return payload, and world-state synchronizer

**Storage**: in-memory scene and payload state only

**Testing**: focused Vitest unit coverage for effect conversion, world-state synchronization semantics, and payload copying; ADOS validation runs outside this runtime

**Target Platform**: browser-based AIverse app

**Project Type**: Next.js application with Phaser city/office interaction surface

**Performance Goals**: O(number of progression triggers) per office exit and world-state synchronization; no network, persistence, or subprocess work

**Constraints**: Mutate only the feature worktree. Do not run validation, start review, publish, merge, deploy, mutate GitHub, or modify the primary repository from this runtime.

**Scale/Scope**: Existing city scene, office scene, company progression triggers, and city world-state snapshot; no visible UI, persistence, city rendering effects, or durable event history

## Constitution Check

- Spec exists before plan and implementation.
- Plan names affected source/test surfaces before code changes.
- Tasks will be created before implementation edits.
- Application changes stay scoped to progression-effect conversion, office return payload wiring, and world-state snapshots.
- Validation commands are documented but intentionally not run from this ADOS handoff runtime.

## Project Structure

### Documentation (this feature)

```text
specs/090-company-progression-world-effect-foundation/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- company-progression-world-effects.md
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
|   |-- officeTypes.ts
|   `-- OfficeProjectPortalController.ts
`-- world-state/
    |-- CompanyProgressionWorldEffectService.ts
    |-- CompanyProgressionWorldEffectService.test.ts
    |-- WorldStateSynchronizer.ts
    |-- WorldStateSynchronizer.test.ts
    `-- WorldStateTypes.ts
```

**Structure Decision**: Keep the world effect shape and synchronization behavior in `world-state/`, because future consumers should observe effects through city world snapshots. Keep office scene and return payload changes limited to the existing city handoff path.

## Design

`CompanyProgressionWorldEffectService` is stateless. It converts copied company progression triggers into copied world effect records. The world-state synchronizer accepts an optional effect list, stores copied effects in successful and status snapshots, includes effects in semantic comparison, and returns copied snapshots.

The office scene reads the portal controller's latest copied progression triggers when the Founder exits. It maps them to world effects and attaches them to the existing city return payload. The city scene passes those payload effects into world-state synchronization during the initial and subsequent synchronizations for that returned city session.

## Validation

Focused validation, outside this runtime:

```powershell
npm test -- CompanyProgressionWorldEffectService WorldStateSynchronizer
```

Full ADOS validation, outside this runtime:

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```
