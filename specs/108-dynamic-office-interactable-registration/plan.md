# Implementation Plan: Dynamic Office Interactable Registration

**Branch**: `codex/108-dynamic-office-interactable-registration` | **Date**: 2026-08-18 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/108-dynamic-office-interactable-registration/spec.md`

## Summary

Allow office interactables to be registered, updated, removed, and redrawn during an office session. The implementation keeps the existing tilemap-derived registry and fallback computer path, adds scoped mutation APIs to the registry, clears stale interaction state in the controller, and lets the visual layer refresh markers from the current object set.

## Technical Context

**Language/Version**: TypeScript 5.8, Next.js 16, React 19, Phaser 3.90

**Primary Dependencies**: Existing office scene, `OfficeInteractiveObjectRegistry`, `OfficeInteractionController`, `OfficeVisualLayer`, Vitest

**Storage**: Existing in-memory office scene state only; no new persistence

**Testing**: Focused Vitest coverage for registry mutation, stale active-object clearing, and visual marker refresh; ADOS validation is not run from this runtime by handoff policy

**Target Platform**: Browser-based AIverse app and local developer workflow

**Project Type**: Single Next.js application

**Performance Goals**: O(n) over registered office interactables per lookup and marker refresh; expected object counts remain small for office scenes

**Constraints**: Mutate only the feature worktree. Do not run validation, start review, publish, merge, deploy, mutate GitHub, or modify the primary repository from this runtime.

**Scale/Scope**: Dynamic in-session interactable registration only; no new object types/actions, persistence, validation/review/runtime starts, repository/GitHub mutation, or deployment

## Constitution Check

- Spec first: passed; `spec.md` and requirements checklist exist before code.
- Plan before code: passed; affected source and validation surfaces are identified before implementation.
- Tasks gate implementation: pending until `tasks.md` exists.
- Preserve application stability: passed; changes are scoped to office interaction registration over existing scene services.
- Validation required: documented below, but not executed in this ADOS runtime by handoff policy.

## Project Structure

### Documentation (this feature)

```text
specs/108-dynamic-office-interactable-registration/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- dynamic-office-interactable-registration.md
|-- checklists/
|   `-- requirements.md
`-- tasks.md
```

### Source Code

```text
src/features/city-view/scene/office/
|-- OfficeInteractiveObjectRegistry.ts
|-- OfficeInteractiveObjectRegistry.test.ts
|-- OfficeInteractionController.ts
|-- OfficeInteractionController.test.ts
|-- OfficeVisualLayer.ts
`-- OfficeVisualLayer.test.ts
```

**Structure Decision**: Keep dynamic registration in the existing office interaction modules because registry lookup, interaction state, and marker rendering already meet there.

## Validation

Focused validation, outside this runtime:

```powershell
npx vitest run src/features/city-view/scene/office/OfficeInteractiveObjectRegistry.test.ts src/features/city-view/scene/office/OfficeInteractionController.test.ts src/features/city-view/scene/office/OfficeVisualLayer.test.ts
```

Full ADOS validation, outside this runtime:

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```

## Complexity Tracking

No constitution violations.
