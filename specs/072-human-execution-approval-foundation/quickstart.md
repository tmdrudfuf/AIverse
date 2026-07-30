# Quickstart: Human Execution Approval Foundation

## Focused Tests

Run the approval-focused tests:

```powershell
npm test -- HumanExecutionApproval OfficeProjectPortalController.issue-sync OfficeProjectPortalView
```

## Full Validation

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```

## Manual Product Flow

1. Open the Project Dashboard.
2. Drive the existing flow until an Execution Plan exists.
3. Trigger readiness validation and confirm `[EXECUTION READINESS]` shows Ready wording.
4. Use the explicit approval action shown by `[HUMAN EXECUTION APPROVAL]`.
5. Confirm the dashboard shows Human Execution Approval Recorded, Execution Approved, Execution Not Started, and Awaiting Runtime Preflight.

## Blocked Cases

- If readiness is Blocked or Failed, approval is unavailable and no approval record is created.
- If current task, assignment, session, employee, repository, role, validation-command, or mutation-scope evidence changes after a previous Ready result, approval revalidates current state and blocks stale contexts.
- Repeating the same approval returns AlreadyApproved without a duplicate.

## Safety Verification

Approval does not start execution, Codex, Claude, subprocesses, validation commands, Git, repository mutation, GitHub mutation, branches, commits, pushes, or PRs.
