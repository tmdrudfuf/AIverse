# Quickstart: Project Dashboard Task Board Entry Action

## Manual Scenario

1. Open the office project portal.
2. From the Company Dashboard list, open the Daily Proof Project Dashboard.
3. Wait for Active Work rows to appear.
4. Press Up or Down and confirm the highlighted Active Work row changes.
5. Press Enter or Space and confirm the existing task detail view opens for the highlighted task.
6. Press Esc and confirm the existing task list appears for the same project.
7. Confirm no task status, assignee, work session, employee, influence, progression, issue, or repository mutation was caused by the dashboard entry action.

## Validation Commands

The ADOS handoff for this runtime says not to run validation commands here. The required commands for a validation-capable runtime are:

```bash
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```
