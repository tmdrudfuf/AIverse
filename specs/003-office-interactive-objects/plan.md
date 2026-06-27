# Implementation Plan: Office Interactive Objects

**Branch**: `003-office-interactive-objects` | **Date**: 2026-06-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-office-interactive-objects/spec.md`

## Summary

Add the first office interactive object system: one placeholder computer interaction in the Daily Proof office. Keep interactive code office-scoped, use Interaction Layer markers as the preferred source, keep Object Layer markers structural, capture Space once, and dispatch actions by priority with exit before object interaction.

## Technical Context

**Language/Version**: TypeScript in a Next.js application

**Primary Dependencies**: React, Next.js, Phaser

**Storage**: Static tilemap asset under `public/assets`; runtime placeholder result in office controller memory

**Testing**: TypeScript check, production build, git whitespace validation, manual office interaction validation

**Target Platform**: Browser

**Project Type**: Web application with Phaser scene module

**Performance Goals**: Object proximity checks remain trivial for the initial object and scalable to small office object lists.

**Constraints**: Preserve existing city transitions, office movement, camera follow, Q/E zoom, and tile collision. Do not add UI panels or real integrations.

**Scale/Scope**: One active Daily Proof office, one initial placeholder computer object.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Spec First: PASS. `spec.md` exists for this feature.
- Plan Before Code: PASS. This plan defines files and validation before code changes.
- Tasks Gate Implementation: PASS after `tasks.md` is generated.
- Preserve Application Stability: PASS. Scope is limited to office scene files, static office tilemap metadata, and Spec Kit artifacts.
- Validation Is Required: PASS. Validation includes `npx tsc --noEmit`, `npm run build`, `git diff --check`, and manual office interaction checks.

## Project Structure

### Documentation (this feature)

```text
specs/003-office-interactive-objects/
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
└── daily-proof-office.tmj

src/features/city-view/scene/office/
├── CompanyOfficeScene.ts
├── OfficeActionInputController.ts
├── OfficeExitController.ts
├── OfficeInteractionController.ts
├── OfficeInteractionPrompt.ts
├── OfficeInteractiveObjectRegistry.ts
├── OfficeTilemapLayer.ts
└── officeTypes.ts
```

**Structure Decision**: Keep object detection, prompts, and placeholder action results inside the office module. Do not introduce shared interaction infrastructure until another scene needs it.

## Complexity Tracking

No constitution violations.
