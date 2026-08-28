# Quickstart: Project Company Office Interior Foundation

## Focused Validation

Run from the feature worktree:

```powershell
npx vitest run src/features/city-view/scene/office/OfficeInteriorFoundation.test.ts src/features/city-view/scene/office/OfficeVisualLayer.test.ts
git diff --check
```

Expected outcomes:

- Daily Proof exposes enabled reception, founder desk, workspace, and employee desk foundation zones.
- Office visual rendering creates and destroys interior zone markers with the office layer lifecycle.
- Existing interactive markers continue to refresh independently of interior zones.

## Manual Scenario

1. Enter the Daily Proof company office from the city.
2. Confirm the office title and interior zone labels are visible.
3. Open the computer workspace and exit the office using the existing controls.

Full ADOS validation is intentionally deferred to ADOS for this handoff.
