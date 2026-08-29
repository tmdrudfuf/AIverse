# Quickstart: Rendered Project Company Office

## Focused Tests

```powershell
npx vitest run src/features/city-view/scene/office/RenderedOfficeComposition.test.ts src/features/city-view/scene/office/OfficeVisualLayer.test.ts src/features/city-view/scene/office/npc/OfficeEmployeeNpcRenderer.test.ts src/features/city-view/scene/office/OfficeInteractionController.test.ts src/features/city-view/scene/office/layout/OfficeLayoutService.test.ts
git diff --check
```

## Runtime Visual Verification

1. Start the AIverse application.
2. Load the city.
3. Enter the active project/company office.
4. Capture the rendered office screenshot.
5. Confirm the old visible founder-desk/employee-desk/debug-zone composition is gone.
6. Confirm Engineering, Review, Validation/QA, Project Status/Operations, reception, lounge/shared space, walls/partitions, corridors, and employee workplace locations are physically visible.
7. Confirm the project portal still opens through the project workspace/computer interaction.

## Deferred to ADOS

ADOS will run the full configured validation pipeline:

```powershell
npm test
npx tsc --noEmit
npm run build
npm run test:e2e:home-canvas
git diff --check
git diff --cached --check
```
