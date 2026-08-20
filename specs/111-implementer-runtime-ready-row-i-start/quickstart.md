# Quickstart: Implementer Runtime Ready Row I Start Label

## Focused Scenario

1. Render a project dashboard state where Runtime Start has reached `Started` and no Implementer Runtime result exists.
2. Confirm the `[IMPLEMENTER RUNTIME]` row includes the `I` start label.
3. Confirm the same row still says Codex has not started.

## Regression Scenarios

1. Render a project without Runtime Start and confirm the row remains unavailable.
2. Render completed, timed-out, cancelled, failed, and blocked Implementer Runtime outcomes and confirm each still shows the outcome.
3. Confirm all row variants remain within the dashboard row text budget.

## Validation Commands

These commands are intentionally documented for an allowed validation runtime. The current ADOS handoff forbids running validation here.

```bash
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```
