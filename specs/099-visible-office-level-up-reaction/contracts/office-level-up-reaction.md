# Contract: Office Level-Up Reaction

## Source

The office scene reads current progression triggers through `OfficeProjectPortalController.getCompanyProgressionTriggers()`.

## Input

```ts
ReadonlyArray<CompanyProgressionTrigger> | undefined
```

## Output

```ts
type OfficeLevelUpReactionViewModel = {
  visible: boolean;
  headline: string;
  stageLabel: string;
  capacityLabel: string;
  floorLabel: string;
  zoneLabel: string;
};
```

## Behavior

- Empty or missing input returns `visible: false` and empty labels.
- Non-empty input selects the last trigger in trigger order.
- Visible output includes reached level, formatted stage, employee capacity, floor count, and unlocked-zone count.
- The returned model is independent from source trigger mutation.
