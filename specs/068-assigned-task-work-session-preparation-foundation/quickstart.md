# Quickstart: Assigned Task Work Session Preparation Foundation

## Focused Tests

```powershell
npx vitest run src/features/city-view/scene/office/prepared-work-sessions/PreparedWorkSessionTypes.test.ts
npx vitest run src/features/city-view/scene/office/prepared-work-sessions/PreparedWorkSessionService.test.ts
npx vitest run src/features/city-view/scene/office/prepared-work-sessions/PreparedWorkSessionView.test.ts
npx vitest run src/features/city-view/scene/office/OfficeProjectPortalController.issue-sync.test.ts
npx vitest run src/features/city-view/scene/office/OfficeProjectPortalView.test.ts
```

## Full Validation

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```

## Manual Smoke Scenario

1. Open the project dashboard for a project with synchronized issues.
2. Approve a Candidate Task for promotion.
3. Promote it into a ProjectTask.
4. Confirm the recommended employee assignment.
5. Press the explicit preparation action once more.
6. Verify the dashboard shows `[WORK SESSION PREPARATION]` with "Prepared", "Not started", "Inactive", and "No agent execution".

## Expected Blocked Behavior

- Stale assignment: preparation result is blocked and no record is stored.
- Unavailable employee: result is unavailable and the employee remains unchanged.
- Started task: result is ineligible and the task status remains unchanged.
- Repeated preparation: result is already prepared with the same prepared-session ID.

## Safety Checks

- ProjectTask remains `Todo`.
- Employee remains not working and does not move.
- No active work session is created.
- No Codex or Claude process starts.
- No repository files are modified at runtime.
- No GitHub mutation occurs.
