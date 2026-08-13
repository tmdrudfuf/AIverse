# Contract: Company Progression Triggers

## Evaluate Triggers

Input:

```ts
{
  previousSnapshot?: CompanyProgressionSnapshot;
  currentSnapshot?: CompanyProgressionSnapshot;
  reachedSnapshots: ReadonlyArray<CompanyProgressionSnapshot>;
}
```

Output:

```ts
CompanyProgressionTrigger[]
```

Rules:

- Return `[]` when `previousSnapshot` or `currentSnapshot` is missing.
- Return `[]` when `currentSnapshot.companyLevel <= previousSnapshot.companyLevel`.
- Return one trigger per reached snapshot where `previousLevel < snapshot.companyLevel <= currentLevel`.
- Return triggers sorted by ascending `toLevel`.
- Copy arrays and milestone objects in every returned trigger.
