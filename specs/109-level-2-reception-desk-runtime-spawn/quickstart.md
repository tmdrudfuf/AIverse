# Quickstart: Level 2 Reception Desk Runtime Spawn

## Focused Validation Scenarios

Run outside this ADOS implementation runtime:

```powershell
npx vitest run src/features/city-view/scene/office/ReceptionDeskRuntimeSpawnService.test.ts src/features/city-view/scene/office/OfficeVisualLayer.test.ts
```

Expected outcomes:

- Level 1 progression does not create a reception desk interactable.
- Level 2 progression with reception unlocked creates exactly one enabled reception desk.
- Layouts without a valid reception zone do not create a desk.
- Visual marker refresh renders enabled desk markers and destroys stale desk markers.

## Full Validation

Run outside this ADOS implementation runtime:

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```
