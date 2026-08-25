# Quickstart: External Project Development Request Draft

## Scenario 1: Create a Request Draft

1. Open the Project Portal.
2. Add or select the external project draft.
3. Open the Project Dashboard and apply a configured repository identity if it is still unknown.
4. Activate the dashboard action again.
5. Expected: the dashboard shows a `[DEV REQUEST]` row for a local-only draft request.

## Scenario 2: Repeat Activation

1. With the `[DEV REQUEST]` row visible, activate the dashboard action again.
2. Expected: there is still exactly one development request draft for the external project.

## Scenario 3: Restore Browser Session

1. Create the request draft.
2. Save and restore browser office session state.
3. Expected: the restored Project Dashboard still shows the same request draft and no runtime, repository, GitHub, task, or validation result is implied.

## Validation Outside This Runtime

ADOS validation is intentionally not run in this implementation runtime. The handoff validation commands remain:

```powershell
npm test
npx tsc --noEmit
npm run build
npm run test:e2e:home-canvas
git diff --check
git diff --cached --check
```
