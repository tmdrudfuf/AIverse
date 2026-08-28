# Implementation Plan: Operator-Driven Office Navigation Foundation

**Branch**: `codex/131-operator-driven-office-navigation-foundation` | **Date**: 2026-08-28 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/131-operator-driven-office-navigation-foundation/spec.md`

## Summary

Add operator-driven pointer navigation to the existing city and office scenes. The implementation extends navigation intent with pointer pan deltas, lets the camera pan independently of Founder focus during pointer drags, adds direct click interactions for enabled buildings and workspace-capable office objects, and suppresses stale pointer actions while blocking overlays are open.

## Technical Context

**Language/Version**: TypeScript 5.8, Next.js 16, React 19, Phaser 3.90

**Primary Dependencies**: Existing `NavigationInputController`, `CameraController`, `CityWorldScene`, `BuildingInteractionController`, `CompanyOfficeScene`, `OfficeInteractionController`, Vitest

**Storage**: N/A

**Testing**: Focused Vitest coverage for pointer input, camera panning, building clicks, and office object clicks; full ADOS validation is run outside this handoff runtime

**Target Platform**: Browser-based AIverse app

**Project Type**: Single Next.js application

**Performance Goals**: Pointer input and camera updates remain synchronous per scene frame and do not add long-running work.

**Constraints**: Mutate only the feature worktree. Do not modify the primary repository. Do not start review, publish, merge, deploy, mutate GitHub, or run the full configured ADOS validation pipeline from this runtime.

**Scale/Scope**: City scene pointer panning and building click entry; office scene pointer panning and workspace-capable object click opening; no new office layout, persistence, ADOS, repository, or GitHub behavior.

## Constitution Check

- Spec first: passed; `spec.md` and requirements checklist exist for feature 131.
- Plan before code: passed for the restored handoff artifacts; affected source and validation surfaces are documented before further implementation corrections.
- Tasks gate implementation: pending until `tasks.md` exists.
- Preserve application stability: passed; source changes are scoped to navigation and interaction controllers/scenes.
- Validation required: focused validation is listed below; full ADOS validation is intentionally deferred to ADOS per handoff policy.

## Project Structure

### Documentation (this feature)

```text
specs/131-operator-driven-office-navigation-foundation/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- operator-driven-office-navigation.md
|-- checklists/
|   `-- requirements.md
`-- tasks.md
```

### Source Code

```text
src/features/city-view/
|-- CityView.tsx
`-- scene/
    |-- CityWorldScene.ts
    |-- buildings/
    |   |-- BuildingInteractionController.ts
    |   `-- BuildingInteractionController.test.ts
    |-- navigation/
    |   |-- CameraController.ts
    |   |-- CameraController.test.ts
    |   |-- NavigationInputController.ts
    |   |-- NavigationInputController.test.ts
    |   |-- NavigationState.ts
    |   `-- navigationTypes.ts
    `-- office/
        |-- CompanyOfficeScene.ts
        |-- OfficeInteractionController.ts
        `-- OfficeInteractionController.test.ts
```

**Structure Decision**: Extend the existing navigation and interaction controllers instead of adding a new scene-level input layer, so keyboard, wheel, pointer, building, and office object behavior stay centralized in the current scene architecture.

## Validation

Focused validation in this runtime:

```powershell
npx vitest run src/features/city-view/scene/navigation/NavigationInputController.test.ts src/features/city-view/scene/navigation/CameraController.test.ts src/features/city-view/scene/buildings/BuildingInteractionController.test.ts src/features/city-view/scene/office/OfficeInteractionController.test.ts
```

Full ADOS validation, outside this runtime:

```powershell
npm test
npx tsc --noEmit
npm run build
npm run test:e2e:home-canvas
git diff --check
git diff --cached --check
```

## Complexity Tracking

No constitution violations.
