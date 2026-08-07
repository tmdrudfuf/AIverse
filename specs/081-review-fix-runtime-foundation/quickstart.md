# Quickstart: Review Fix Runtime Foundation

## Start Action

Use `X` to start the Review Fix Runtime for the current Review Fix Plan. This key is distinct from existing workflow actions:

- `I`: Implementer Runtime
- `R`: Reviewer Runtime
- `P`: Promote review result
- `F`: Request review fixes
- `G`: Plan review fixes
- `X`: Start Review Fix Runtime

## Focused Validation

```powershell
npm test -- ReviewFixRuntime OfficeActionInputController OfficeProjectPortalController.review-fix-runtime OfficeProjectPortalController.review-decision
```

## Full Validation

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```

## Manual Safety Checks

- Confirm runtime does not start on render or refresh.
- Confirm non-human actors block before provider spawn.
- Confirm stale Review Fix Plans block before provider spawn.
- Confirm runtime completion does not start validation or reviewer runtime.
- Confirm no GitHub mutation, push, PR creation, Ready transition, merge, deploy, branch deletion, or cleanup is attempted.
