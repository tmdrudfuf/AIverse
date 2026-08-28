# Quickstart: Operator-Driven Office Navigation Foundation

## Focused Validation

Run the focused tests for this feature:

```powershell
npx vitest run src/features/city-view/scene/navigation/NavigationInputController.test.ts src/features/city-view/scene/navigation/CameraController.test.ts src/features/city-view/scene/buildings/BuildingInteractionController.test.ts src/features/city-view/scene/office/OfficeInteractionController.test.ts
```

Expected result: all listed tests pass.

## Manual Scenario

1. Open AIverse to the city view.
2. Drag the city surface and verify the camera pans without moving the Founder.
3. Click the active company building and verify the office opens.
4. In the office, drag the surface and verify the camera pans.
5. Click a workspace-capable office object and verify the project workspace portal opens.
6. With the portal open, interact with the pointer behind the overlay and verify no camera pan or stale click action fires.

## Full ADOS Validation

ADOS runs the authoritative full validation outside this runtime:

```powershell
npm test
npx tsc --noEmit
npm run build
npm run test:e2e:home-canvas
git diff --check
git diff --cached --check
```
