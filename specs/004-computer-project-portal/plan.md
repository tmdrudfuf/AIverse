# Implementation Plan: Computer Project Portal

**Branch**: `004-computer-project-portal` | **Date**: 2026-06-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-computer-project-portal/spec.md`

## Summary

Add a lightweight Phaser screen-space Project Portal overlay that opens when the Founder uses the office computer. The portal displays static placeholder project and service data, closes with Esc or Space, and blocks office movement, zoom, exit, and object interactions while open.

## Technical Context

**Language/Version**: TypeScript in a Next.js application

**Primary Dependencies**: React, Next.js, Phaser

**Storage**: Static in-memory placeholder portal data

**Testing**: TypeScript check, production build, git whitespace validation, manual office portal validation

**Target Platform**: Browser

**Project Type**: Web application with Phaser scene module

**Performance Goals**: Overlay uses a small number of Phaser display objects and no external data fetching.

**Constraints**: Do not change scenes, do not use React overlay, do not add real integrations, dashboards, NPCs, or simulation.

**Scale/Scope**: One office computer opens one static project portal overlay.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Spec First: PASS. `spec.md` exists for this feature.
- Plan Before Code: PASS. This plan defines affected files and validation before code changes.
- Tasks Gate Implementation: PASS after `tasks.md` is generated.
- Preserve Application Stability: PASS. Scope is limited to office scene files and Spec Kit artifacts.
- Validation Is Required: PASS. Validation includes `npx tsc --noEmit`, `npm run build`, `git diff --check`, and manual portal checks.

## Project Structure

### Documentation (this feature)

```text
specs/004-computer-project-portal/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── tasks.md
```

### Source Code (repository root)

```text
src/features/city-view/scene/office/
├── CompanyOfficeScene.ts
├── OfficeActionInputController.ts
├── OfficeInteractionController.ts
├── OfficeProjectPortalController.ts
├── OfficeProjectPortalRegistry.ts
├── OfficeProjectPortalTypes.ts
└── OfficeProjectPortalView.ts
```

**Structure Decision**: Keep portal implementation in the office scene module because Phase 10 is Phaser-only and opened from the office computer. Future dashboard work can migrate richer UI to a React feature boundary.

## Complexity Tracking

No constitution violations.