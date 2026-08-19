# Quickstart: Dynamic Office Interactable Registration

## Manual Scenario

1. Open the office scene.
2. Register an enabled computer interactable during the office session.
3. Move the founder into the registered object's zone.
4. Confirm the office prompt targets the registered object.
5. Disable or remove that object.
6. Confirm the prompt clears on the next scene update.
7. Refresh interactive visual markers and confirm stale markers are removed.

## Focused Validation

Run outside this ADOS runtime:

```powershell
npx vitest run src/features/city-view/scene/office/OfficeInteractiveObjectRegistry.test.ts src/features/city-view/scene/office/OfficeInteractionController.test.ts src/features/city-view/scene/office/OfficeVisualLayer.test.ts
```

## Full ADOS Validation

Run outside this ADOS runtime:

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```
