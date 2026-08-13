# Quickstart: Spec 091 - Company Progression Reward Foundation

## Focused Validation

Run outside this ADOS handoff runtime:

```powershell
npm test -- CompanyProgressionRewardService WorldStateSynchronizer OfficeExitController
```

Expected results:

- Progression world effects map to ordered copied rewards.
- World-state snapshots include copied rewards.
- Repeated synchronization with unchanged rewards reports `changed: false`.
- Synchronization with different rewards reports `changed: true`.
- Office return payloads copy rewards when present and omit them when absent.

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
