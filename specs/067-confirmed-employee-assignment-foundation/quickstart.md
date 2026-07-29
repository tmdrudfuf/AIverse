# Quickstart: Confirmed Employee Assignment Foundation

## Run Focused Tests

```powershell
npx vitest run src/features/city-view/scene/office/confirmed-assignments/ConfirmedEmployeeAssignmentTypes.test.ts
npx vitest run src/features/city-view/scene/office/confirmed-assignments/ConfirmedEmployeeAssignmentService.test.ts
npx vitest run src/features/city-view/scene/office/confirmed-assignments/ConfirmedEmployeeAssignmentView.test.ts src/features/city-view/scene/office/OfficeProjectPortalController.issue-sync.test.ts src/features/city-view/scene/office/OfficeProjectPortalView.test.ts
```

## Run Full Validation

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```

## Manual Behavior Check

1. Open the Project Dashboard.
2. Sync repository/issues to produce Candidate Tasks.
3. Confirm an assignment recommendation exists for a Candidate Task.
4. Approve the Candidate Task for promotion.
5. Promote the approved Candidate Task to a ProjectTask.
6. Use the explicit assignment confirmation action.
7. Verify the ProjectTask shows the recommended employee as assignee.
8. Verify task status remains `Todo`.
9. Verify dashboard text says `Not started` and `No work session`.

## Blocked Cases

- Stale recommendation: assignment is blocked.
- Employee unavailable/offline/working: assignment is blocked.
- Task already assigned: assignment is blocked or idempotent only for the same employee.
- Task already started: assignment is blocked.
- Repeated confirmation: no duplicate assignment or activity.

## Safety Checks

- No employee moves.
- No employee status changes to `Working`.
- No work session is created.
- No Codex or Claude runtime execution occurs.
- No GitHub mutation occurs.
- No remote branch, PR, label, issue, or repository state changes occur.

Durable persistence is deferred; assignment records are local in-memory portal state.
