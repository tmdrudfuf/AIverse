# Quickstart: Spec 088 - World State Synchronization Foundation

## Focused Scenario

1. Build a `WorldStateSynchronizer`.
2. Synchronize with the city world id, city scene key, city bounds, configured buildings, and a Founder state.
3. Confirm the snapshot reports one world, one active world space, three buildings, one Founder actor, and `Succeeded`.
4. Synchronize again with the same facts and confirm `changed` is `false`.
5. Move the Founder and synchronize again; confirm `changed` is `true` and the Founder coordinates update.
6. Mutate the original input objects and confirm previously returned snapshots do not change.

## Focused Validation

Run outside this ADOS runtime:

```powershell
npm test -- WorldStateSynchronizer
```

## Full ADOS Validation

Run outside this ADOS runtime:

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```
