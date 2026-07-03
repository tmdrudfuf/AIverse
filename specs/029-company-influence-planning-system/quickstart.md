# Quickstart: Company Influence Planning System

## Prerequisites

- Company Dashboard System implementation is available on the active branch.
- Dependencies are installed.

## Run the App

```powershell
npx next dev -p 3000
```

Open:

```text
http://localhost:3000
```

## Manual Validation Checklist

1. Enter the playable app and reach the office.
2. Use the existing computer interaction to open the project portal.
3. Open the Company Dashboard.
4. Verify the dashboard shows a neutral or unset company focus if no focus has been selected.
5. Open the Company Influence Planning view from the dashboard.
6. Select "Improve delivery speed".
7. Return to the dashboard and verify the active focus shows "Improve delivery speed".
8. Repeat selection and dashboard verification for:
   - Improve quality
   - Improve team morale
   - Reduce project risk
   - Prepare for company growth
9. Close and reopen the dashboard during the same runtime session.
10. Verify the last selected focus remains visible.
11. Confirm project portal opening and closing still works.
12. Confirm office movement still works.
13. Confirm computer interaction still works.
14. Confirm NPC labels and employee simulation continue to display normally.
15. Confirm no direct employee assignment, task assignment, task completion, project control, dialogue choice, economy, payroll, relationship, or direct employee-control affordance appears.
16. Confirm changing focus does not directly change employee AI state, project task status, schedule state, work-session progress, NPC movement, or project execution.

## Automated Validation

Run before the feature is considered complete:

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```

## Expected Result

The player can select one local company focus from the dashboard flow. The dashboard clearly shows the active focus, and existing office, portal, dashboard, movement, computer interaction, employee simulation, and project execution behavior remains unchanged.
