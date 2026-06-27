# Implementation Plan: Project Portal Selection

**Branch**: `005-project-portal-selection` | **Date**: 2026-06-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/005-project-portal-selection/spec.md`

## Summary

Extend the Phaser Project Portal overlay with keyboard selection, list/detail view state, placeholder project details, and placeholder detail actions. Keep controller-owned navigation rules, presentational view rendering, and scene-level input routing.

## Technical Context

**Language/Version**: TypeScript in a Next.js application

**Primary Dependencies**: React, Next.js, Phaser

**Storage**: Static in-memory placeholder portal data

**Testing**: TypeScript check, production build, git whitespace validation, manual portal selection validation

**Target Platform**: Browser

**Project Type**: Web application with Phaser scene module

**Performance Goals**: Portal selection/detail rendering remains lightweight with a fixed small data set.

**Constraints**: No React overlay, real integrations, API calls, NPCs, simulation, selectable service rows, or complex dashboard UI.

**Scale/Scope**: Three static projects and one simple detail view.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Spec First: PASS. `spec.md` exists for this feature.
- Plan Before Code: PASS. This plan defines files and validation before code changes.
- Tasks Gate Implementation: PASS after `tasks.md` is generated.
- Preserve Application Stability: PASS. Scope is limited to portal/input files and Spec Kit artifacts.
- Validation Is Required: PASS. Validation includes `npx tsc --noEmit`, `npm run build`, `git diff --check`, and manual portal checks.

## Project Structure

### Documentation (this feature)

```text
specs/005-project-portal-selection/
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
├── OfficeProjectPortalController.ts
├── OfficeProjectPortalRegistry.ts
├── OfficeProjectPortalTypes.ts
└── OfficeProjectPortalView.ts
```

**Structure Decision**: Keep Phase 11 inside the existing office portal boundary. Controller owns state/navigation, view renders state, registry owns static data, scene routes consumed input only.

## Complexity Tracking

No constitution violations.