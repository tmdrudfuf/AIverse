# Quickstart: Project Portal Add External Project Draft Action

## Focused Scenario

1. Open the Project Portal.
2. Move selection to Add External Project.
3. Press Enter or Space.
4. Confirm a planned External Project Draft appears in the project list and is selected.
5. Activate Add External Project again.
6. Confirm there is still exactly one draft.
7. Restore portal state from browser session storage.
8. Confirm the draft is present in `projects` and `projectRegistryEntries`, with no repository mapping.

## Focused Validation Command

Run outside this ADOS runtime:

```powershell
npx vitest run src/features/city-view/scene/office/OfficeProjectPortalController.project-dashboard.test.ts src/features/city-view/scene/office/OfficeProjectPortalRegistry.test.ts
```

## Full ADOS Validation Commands

Run outside this ADOS runtime:

```powershell
npm test
npx tsc --noEmit
npm run build
npm run test:e2e:home-canvas
git diff --check
git diff --cached --check
```
