# Quickstart: Explicit Work Session Start Foundation

## Focused Validation

Run the active-session tests:

```powershell
npx vitest run src/features/city-view/scene/office/active-work-sessions/ActiveWorkSessionTypes.test.ts
npx vitest run src/features/city-view/scene/office/active-work-sessions/ActiveWorkSessionStartService.test.ts
npx vitest run src/features/city-view/scene/office/active-work-sessions/ActiveWorkSessionView.test.ts
```

Run controller and dashboard integration tests:

```powershell
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

## Manual Flow

1. Open the project dashboard for a project with synchronized issues and a matching employee.
2. Approve the Candidate Task for promotion.
3. Use a separate input to promote the approved Candidate Task to a ProjectTask.
4. Use a separate input to confirm the recommended employee assignment.
5. Use a separate input to prepare the work session.
6. Use a separate input to start the work session.

Expected result:

- `[ACTIVE WORK SESSION]` appears in the project dashboard.
- The ProjectTask is `In Progress`.
- The employee is logically `Working`.
- The row says agent execution has not started.
- The row says no repository mutation occurred.
- The prepared-session record remains historical.

## Repeated Start

Repeat the start input after a successful start.

Expected result:

- no duplicate active session is created;
- the existing active-session ID is returned;
- the result status is `AlreadyStarted`;
- validation still checks current task, assignment, employee, and active-session state.

## Blocked Start

Set the task to `Done`, make the employee `Offline`, or alter the prepared-session project/task linkage before starting.

Expected result:

- the start is blocked with a safe reason code;
- no task transition occurs;
- no employee transition occurs;
- no active session is created.

## Safety Verification

During and after the flow, verify:

- no Codex or Claude process starts;
- no subprocess is spawned by the feature;
- no repository files are modified by the runtime action;
- no branch or commit is created;
- no GitHub issue, comment, label, pull request, or branch is mutated.
