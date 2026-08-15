# Implementation Plan: Spec 099 - Visible Office Level-Up Reaction

**Branch**: `codex/099-visible-office-level-up-reaction` | **Date**: 2026-08-14 | **Spec**: `specs/099-visible-office-level-up-reaction/spec.md`

**Input**: Feature specification from `/specs/099-visible-office-level-up-reaction/spec.md`

## Summary

Render a compact, read-only office level-up reaction when existing company progression triggers are present. The reaction is derived from copied `CompanyProgressionTrigger` data, shows the newest reached level with stage, capacity, floor, and unlocked-zone context, hides when no trigger exists, and does not change progression, reward, portal, city handoff, persistence, or runtime behavior.

## Technical Context

**Language/Version**: TypeScript 5.8, Next.js 16, Phaser 3.90, Vitest

**Primary Dependencies**: existing `CompanyProgressionTrigger`, `OfficeProjectPortalController.getCompanyProgressionTriggers()`, `CompanyOfficeScene`, and Phaser scene text/graphics APIs

**Storage**: in-memory scene display state only

**Testing**: focused Vitest unit coverage for reaction view-model formatting, empty state, newest-trigger selection, and immutability; ADOS validation runs outside this runtime

**Target Platform**: browser-based AIverse app

**Project Type**: Next.js application with Phaser city/office interaction surface

**Performance Goals**: O(number of current progression triggers), with expected trigger lists small and bounded by progression level count

**Constraints**: Mutate only the feature worktree. Do not run validation, start review, publish, merge, deploy, mutate GitHub, or modify the primary repository from this runtime.

**Scale/Scope**: Existing office scene and current progression triggers only; no persistence, new art, sound, dismissal controls, reward generation, city-panel changes, runtime execution, review automation, validation execution, or GitHub integration changes

## Constitution Check

- Spec exists before plan and implementation.
- Plan names affected source/test surfaces before code changes.
- Tasks will be created before implementation edits.
- Application changes stay scoped to office level-up reaction formatting, rendering, and office scene wiring.
- Validation commands are documented but intentionally not run from this ADOS handoff runtime.

## Project Structure

### Documentation (this feature)

```text
specs/099-visible-office-level-up-reaction/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- office-level-up-reaction.md
|-- checklists/
|   `-- requirements.md
`-- tasks.md
```

### Source Code (repository root)

```text
src/features/city-view/scene/office/
|-- CompanyOfficeScene.ts
|-- OfficeLevelUpReactionLayer.ts
`-- OfficeLevelUpReactionLayer.test.ts
```

**Structure Decision**: Keep the reaction renderer beside other office scene rendering classes because it is an in-scene Phaser projection. Wire it from `CompanyOfficeScene` using the controller's copied trigger accessor so no new progression storage or mutation path is introduced.

## Design

`OfficeLevelUpReactionLayer` owns Phaser display objects for a fixed compact reaction panel. It exposes `update(triggers?: ReadonlyArray<CompanyProgressionTrigger>)` and `destroy()`.

Pure helpers create `OfficeLevelUpReactionViewModel` from current progression triggers. They pick the newest trigger, format the reached level, stage, capacity, floor count, and unlocked-zone summary, and return hidden labels when no trigger exists.

`CompanyOfficeScene` creates the layer during scene setup, updates it from `officeProjectPortalController.getCompanyProgressionTriggers()` alongside the existing office progression visual state refresh, and destroys it with the other office controllers.

## Validation

Focused validation, outside this runtime:

```powershell
npm test -- OfficeLevelUpReactionLayer
```

Full ADOS validation, outside this runtime:

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```
