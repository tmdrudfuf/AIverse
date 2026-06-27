# Implementation Plan: Office Tilemap Layout

**Branch**: `002-office-tilemap-layout` | **Date**: 2026-06-26 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-office-tilemap-layout/spec.md`

## Summary

Replace the Daily Proof office placeholder graphics with a Phaser tilemap-backed interior layout while preserving existing scene transition, input, camera, and founder movement behavior. The tilemap provides spatial data only: visual layers, collision, object markers, and a reserved interaction layer.

## Technical Context

**Language/Version**: TypeScript in a Next.js application

**Primary Dependencies**: React, Next.js, Phaser

**Storage**: Static assets under `public/assets`

**Testing**: TypeScript check, production build, git whitespace validation, manual browser validation

**Target Platform**: Browser

**Project Type**: Web application with Phaser scene module

**Performance Goals**: Office scene loads promptly with a small static tilemap and maintains current movement/camera responsiveness.

**Constraints**: Preserve existing City -> Office -> City behavior; do not add desks, NPCs, computers, workers, or simulation.

**Scale/Scope**: One active Daily Proof office interior at 960 by 600 world size.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Spec First: PASS. `spec.md` exists for this feature.
- Plan Before Code: PASS. This plan defines affected files and validation before code changes.
- Tasks Gate Implementation: PASS after `tasks.md` is generated.
- Preserve Application Stability: PASS. Scope is limited to office scene files, static office assets, and Spec Kit artifacts.
- Validation Is Required: PASS. Validation includes `npx tsc --noEmit`, `npm run build`, `git diff --check`, and manual office transition checks.

## Project Structure

### Documentation (this feature)

```text
specs/002-office-tilemap-layout/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── tasks.md
```

### Source Code (repository root)

```text
public/assets/office/daily-proof/
├── daily-proof-office.tmj
└── office-tiles.png

src/features/city-view/scene/office/
├── CompanyOfficeScene.ts
├── OfficeCollisionMap.ts
├── OfficeTileMovementResolver.ts
├── OfficeTilemapLayer.ts
├── OfficeVisualLayer.ts
├── officeConfig.ts
└── officeTypes.ts
```

**Structure Decision**: Keep office-specific tilemap loading, marker extraction, and collision behavior inside the existing office scene module. Avoid generalizing city tilemap utilities unless duplication becomes meaningful after implementation.

## Complexity Tracking

No constitution violations.
