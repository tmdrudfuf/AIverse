# Implementation Plan: Rendered Project Company Office

**Branch**: `codex/135-rendered-project-company-office` | **Date**: 2026-08-28 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/135-rendered-project-company-office/spec.md`

## Summary

Replace the visible project-company office presentation with a rendered top-down pixel-art autonomous software-company environment. Keep the existing Phaser scene, tilemap, collision, portal, navigation, ADOS surface, and employee/NPC infrastructure, but replace the debug-like visual overlay with a dense physical office composition aligned with the official reference.

## Technical Context

**Language/Version**: TypeScript 5.8, Next.js 16, React 19, Phaser 3.90

**Primary Dependencies**: Existing Phaser scene helpers, `OfficeVisualLayer`, `OfficeInteractiveObjectRegistry`, `OfficeLayoutService`, NPC renderer/resolver, Vitest, Playwright

**Storage**: N/A

**Testing**: Focused Vitest coverage for rendered composition contracts, NPC position mapping, and existing click-to-portal interaction behavior; runtime screenshot verification of actual project office where tooling permits

**Target Platform**: Browser-based AIverse app

**Project Type**: Single Next.js application

**Performance Goals**: Render static office graphics synchronously with small primitive counts suitable for the existing canvas scene.

**Constraints**: Mutate only the feature worktree. Do not modify the primary repository. Do not start review, publish, merge, deploy, mutate GitHub, or run the full configured ADOS validation pipeline from this runtime. ADOS will run authoritative validation after implementation.

**Scale/Scope**: Localized Phaser office rendering replacement, semantic composition helper, NPC destination mapping, focused tests, and runtime visual evidence.

## Constitution Check

- Spec first: passed; Spec 135 artifact is restored from the authoritative handoff requirements.
- Plan before code: passed; affected source and validation surfaces are documented before implementation.
- Tasks gate implementation: passed once `tasks.md` exists.
- Preserve application stability: passed; existing office controllers and interactions are preserved while presentation changes.
- Validation required: focused validation and runtime visual verification are listed; full ADOS validation is intentionally deferred to ADOS per handoff policy.

## Project Structure

### Documentation (this feature)

```text
specs/135-rendered-project-company-office/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- rendered-project-company-office.md
|-- checklists/
|   `-- requirements.md
`-- tasks.md
```

### Source Code

```text
src/features/city-view/scene/office/
|-- OfficeVisualLayer.ts
|-- OfficeVisualLayer.test.ts
|-- RenderedOfficeComposition.ts
|-- RenderedOfficeComposition.test.ts
|-- npc/
|   |-- EmployeeNpcPositionResolver.ts
|   `-- OfficeEmployeeNpcRenderer.test.ts
|-- OfficeInteractionController.test.ts
`-- layout/
    |-- OfficeLayoutTypes.ts
    |-- OfficeLayoutService.ts
    `-- OfficeLayoutService.test.ts
```

**Structure Decision**: Add a reusable rendered composition model/helper next to the office visual layer, then have `OfficeVisualLayer` render physical areas and furniture from that model. Keep layout metadata and controllers in place for compatibility.

## Validation

Focused validation in this runtime:

```powershell
npx vitest run src/features/city-view/scene/office/RenderedOfficeComposition.test.ts src/features/city-view/scene/office/OfficeVisualLayer.test.ts src/features/city-view/scene/office/npc/OfficeEmployeeNpcRenderer.test.ts src/features/city-view/scene/office/OfficeInteractionController.test.ts src/features/city-view/scene/office/layout/OfficeLayoutService.test.ts
git diff --check
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

Runtime visual verification:

```text
Start the real app, load the city, enter the active project/company, capture the actual project office, and compare it against Spec 135 plus docs/visual-references/office-reference.png.
```

## Complexity Tracking

No constitution violations.
