# Quickstart: Reception Desk Upgrade Benefits Interaction

## Focused Scenarios

1. Start at level 1 progression.
2. Open the existing workspace.
3. Verify reception upgrade benefits are not shown.
4. Advance to level 2 by meeting the existing progression milestones.
5. Activate the level 2 reception desk to open the workspace.
6. Verify the workspace shows reception upgrade benefits for reception, employee capacity, and workspace coordination.

## Focused Validation

Run outside this ADOS implementation runtime:

```powershell
npx vitest run src/features/city-view/scene/office/ReceptionDeskUpgradeBenefitsService.test.ts src/features/city-view/scene/office/OfficeProjectPortalView.test.ts
```

## Full Validation

Run outside this ADOS implementation runtime:

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```
