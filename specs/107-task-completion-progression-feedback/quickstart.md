# Quickstart: Task Completion Progression Feedback

## Focused Validation Scenario

1. Open the office project portal.
2. Open a project task that is in `Review`.
3. Press the existing task action key to mark the task Done.
4. Confirm task detail remains open and shows a completion progression feedback row.
5. Confirm the task activity log includes the existing Done status-change activity.
6. Confirm the current office session has refreshed company progression triggers if the completion reaches a new level.

## Focused Test Command

Run outside this ADOS runtime:

```powershell
npx vitest run src/features/city-view/scene/office/OfficeProjectPortalController.project-dashboard.test.ts src/features/city-view/scene/office/OfficeProjectPortalView.test.ts
```

## Full Validation Commands

Run outside this ADOS runtime:

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```
