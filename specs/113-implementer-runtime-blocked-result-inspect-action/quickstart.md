# Quickstart: Implementer Runtime Blocked Result Inspect Action

## Scenario: Blocked Result Shows Inspect Cue

1. Render a project dashboard state where Runtime Start has reached `Started`.
2. Provide an Implementer Runtime result collection whose latest result is `Blocked`.
3. Confirm the `[IMPLEMENTER RUNTIME]` row includes `blocked`, `inspect`, and `Codex not started`.
4. Confirm the row does not imply reviewer, validation, repository mutation, GitHub mutation, approval, merge, publish, or deploy work has started.

## Scenario: Other States Are Unchanged

1. Render a project with Runtime Start ready and no Implementer Runtime result; confirm the row still shows the `I` start cue.
2. Render completed, timed-out, cancelled, and failed Implementer Runtime outcomes; confirm each still shows its outcome instead of blocked-result wording.

## Validation Commands

These commands are intentionally documented for an allowed validation runtime. The current ADOS handoff forbids running validation here.

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```
