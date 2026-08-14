# Implementation Plan: Spec 095 - Office Progression Visual State

**Branch**: `codex/095-office-progression-visual-state` | **Date**: 2026-08-13 | **Spec**: `specs/095-office-progression-visual-state/spec.md`

**Input**: Feature specification from `/specs/095-office-progression-visual-state/spec.md`

## Summary

Render a compact, read-only office progression visual state inside the company office scene. The state is derived from the existing `CompanyProgressionSnapshot` and active office layout, showing current level/stage/capacity/floors plus bounded active-zone markers without changing persistence, tilemap art, portal behavior, or city world-state synchronization.

## Technical Context

**Language/Version**: TypeScript 5.8, Next.js 16, Phaser 3.90, Vitest

**Primary Dependencies**: existing `OfficeProjectPortalController.getCompanyProgressionSnapshot()`, `getActiveOfficeLayout()`, `CompanyOfficeScene`, `OfficeLayoutSnapshot`, and Phaser scene text/graphics APIs

**Storage**: in-memory scene state only

**Testing**: focused Vitest unit coverage for office progression visual-state formatting and bounded zone markers; ADOS validation runs outside this runtime

**Target Platform**: browser-based AIverse app

**Project Type**: Next.js application with Phaser city/office interaction surface

**Performance Goals**: O(number of visible layout zones) per office update; marker rendering caps visible zones at six

**Constraints**: Mutate only the feature worktree. Do not run validation, start review, publish, merge, deploy, mutate GitHub, or modify the primary repository from this runtime.

**Scale/Scope**: Existing company office scene and progression snapshot; no persistence, new art, floor navigation, layout redesign, React overlay, animation, or reward/event generation changes

## Constitution Check

- Spec exists before plan and implementation.
- Plan names affected source/test surfaces before code changes.
- Tasks will be created before implementation edits.
- Application changes stay scoped to office progression visual-state formatting, rendering, and office scene wiring.
- Validation commands are documented but intentionally not run from this ADOS handoff runtime.

## Project Structure

### Documentation (this feature)

```text
specs/095-office-progression-visual-state/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- office-progression-visual-state.md
|-- checklists/
|   `-- requirements.md
`-- tasks.md
```

### Source Code (repository root)

```text
src/features/city-view/scene/office/
|-- CompanyOfficeScene.ts
|-- OfficeProgressionVisualStateLayer.ts
`-- OfficeProgressionVisualStateLayer.test.ts
```

**Structure Decision**: Keep the office progression visual-state renderer beside office scene rendering classes because it consumes office layout positions and current office progression data. Wire it from `CompanyOfficeScene` after the portal controller is created so it reads the same progression snapshot and active layout used by existing dashboard/AI/employee systems.

## Design

`OfficeProgressionVisualStateLayer` owns Phaser display objects for a fixed office summary and active-zone markers. It exposes `update(progression?: CompanyProgressionSnapshot, layout?: OfficeLayoutSnapshot)` and `destroy()`.

Pure helpers create `OfficeProgressionVisualStateViewModel` from progression and layout snapshots. They format stage labels, capacity, floors, active-zone count, and a bounded marker list from unlocked layout zones. Empty or missing inputs produce an invisible state.

`CompanyOfficeScene` creates the layer during scene setup, updates it from `officeProjectPortalController.getCompanyProgressionSnapshot()` and `getActiveOfficeLayout()`, and destroys it with the other office controllers.

## Validation

Focused validation, outside this runtime:

```powershell
npm test -- OfficeProgressionVisualStateLayer
```

Full ADOS validation, outside this runtime:

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```
