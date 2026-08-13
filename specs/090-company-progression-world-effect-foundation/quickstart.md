# Quickstart: Spec 090 - Company Progression World Effect Foundation

## Focused Validation

Run outside this ADOS handoff runtime:

```powershell
npm test -- CompanyProgressionWorldEffectService WorldStateSynchronizer
```

Expected results:

- Progression triggers map to ordered copied world effects.
- World-state snapshots include copied effects.
- Repeated synchronization with unchanged effects reports `changed: false`.
- Synchronization with different effects reports `changed: true`.

## Full ADOS Validation

Run outside this ADOS handoff runtime:

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```

Expected results:

- All tests pass.
- TypeScript check passes.
- Production build succeeds.
- Diff whitespace checks pass.
