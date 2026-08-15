# Data Model: Visible Office Level-Up Reaction

## Office Level-Up Reaction

Represents the visible office HUD reaction derived from current company progression trigger data.

Fields:

- `visible`: whether the reaction should be rendered.
- `headline`: compact reached-level text.
- `stageLabel`: formatted company stage.
- `capacityLabel`: employee capacity summary.
- `floorLabel`: floor count summary.
- `zoneLabel`: unlocked-zone summary.

Validation rules:

- Hidden reactions use empty labels.
- Visible reactions require a selected progression trigger.
- Labels are derived values and do not mutate source triggers.

## Company Progression Trigger Snapshot

Existing level-up trigger data used as the reaction source.

Fields consumed:

- `triggerId`
- `toLevel`
- `companyStage`
- `maxEmployees`
- `floorCount`
- `unlockedOfficeZones`

Relationships:

- One reaction view model is derived from the newest current trigger.
- Multiple triggers are reduced to the newest reached level for compact display.

## State Transitions

- No triggers -> hidden reaction.
- One or more triggers -> visible reaction derived from the last trigger.
- Trigger list becomes empty -> hidden reaction with previous labels cleared.
