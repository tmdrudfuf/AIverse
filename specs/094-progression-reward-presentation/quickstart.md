# Quickstart: Progression Reward Presentation

## Focused Check

Run outside this ADOS runtime:

```powershell
npm test -- ProgressionRewardPresentationPanel
```

Expected outcomes:

- One progression reward creates one display row with level, stage, capacity, floor, and unlocked-zone information.
- Empty rewards create no rows.
- More than three rewards are capped to the latest three display rows.
- Mutating returned display rows does not mutate source reward records.

## Manual Scenario

1. Enter the office and complete progression conditions that grant a company progression reward.
2. Exit back to the city.
3. Confirm a compact city reward presentation appears below the progression event feed panel with the latest reward benefits.
4. Confirm city navigation remains usable and the reward presentation does not overlap the event feed panel.
5. Return to the city without progression rewards and confirm the reward presentation is hidden.
