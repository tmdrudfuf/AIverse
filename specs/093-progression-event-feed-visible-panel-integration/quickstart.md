# Quickstart: Progression Event Feed Visible Panel Integration

## Focused Validation Scenario

Run outside this ADOS runtime:

```powershell
npm test -- ProgressionEventFeedPanel
```

Expected outcomes:

- One progression feed event creates one display row with level, stage, unlocked-zone, and milestone information.
- Empty feed events create no rows.
- More than three feed events are capped to the latest three display rows.
- Long unlocked-zone lists are summarized.

## Manual Scenario

1. Enter the office and complete progression conditions that grant a company progression reward.
2. Exit back to the city.
3. Confirm a compact top-right city panel appears with the latest progression event summary.
4. Confirm city navigation and building prompts remain usable.
5. Return to the city without progression feed events and confirm the panel is hidden.
