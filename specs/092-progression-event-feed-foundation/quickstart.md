# Quickstart: Spec 092 - Progression Event Feed Foundation

## Focused Validation

Run outside this ADOS handoff runtime:

```powershell
npm test -- CompanyProgressionEventFeedService WorldStateSynchronizer OfficeExitController
```

Expected outcomes:

- Progression rewards convert to ordered copied feed events.
- World-state snapshots store copied feed events and include them in semantic comparison.
- Office exit payloads copy feed events and omit empty feed lists.

## Full ADOS Validation

Run outside this ADOS handoff runtime:

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```

Expected outcomes:

- All tests pass.
- TypeScript emits no errors.
- Production build completes.
- Diff whitespace checks pass.
