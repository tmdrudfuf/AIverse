# Quickstart: Reviewer Runtime Uncommitted Target Blocked Result Explanation

## Focused Display Check

1. Render a project whose Implementer Runtime result is completed.
2. Add a latest Reviewer Runtime result with status `Blocked` and the uncommitted target reason.
3. Confirm the `[REVIEWER RUNTIME]` row includes `Blocked`, `uncommitted target`, `inspect`, and `not started`.
4. Confirm the full row, including prefix, remains within the existing 78-character wrap budget.

## Regression Checks

1. Render a blocked Reviewer Runtime result without the uncommitted target reason; confirm it still prompts requirement resolution.
2. Render ready, completed, timed-out, and failed Reviewer Runtime states; confirm each still shows its existing outcome wording.
3. Confirm no Reviewer Runtime row claims validation, repository mutation, GitHub mutation, approval-for-merge, publishing, or deployment work has started.

## Validation Commands For Allowed Runtime

The ADOS handoff prohibits running validation in this implementer runtime. An allowed validation runtime should run:

```text
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```
