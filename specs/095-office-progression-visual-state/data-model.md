# Data Model: Office Progression Visual State

## Office Progression Visual State View Model

- `visible`: Whether the visual state has enough progression/layout data to render.
- `summaryTitle`: Compact level/stage label.
- `capacityLabel`: Employee capacity display text.
- `floorLabel`: Floor count display text.
- `zoneCountLabel`: Active-zone count display text.
- `markers`: Bounded active office zone markers.

## Active Office Zone Marker

- `id`: Stable marker id derived from the layout zone id.
- `label`: Display-safe zone label.
- `x`: World-space marker x coordinate derived from the zone position hint.
- `y`: World-space marker y coordinate derived from the zone position hint.

## Source Entities

- `CompanyProgressionSnapshot`: Existing source for current level, stage, unlocked zones, max employee count, layout id, and floor count.
- `OfficeLayoutSnapshot`: Existing source for active office zones and position hints.

## Validation Rules

- Missing progression or layout data produces `visible: false` and no markers.
- Markers are created only for layout zones whose type is present in `progression.unlockedOfficeZones`.
- Marker count is capped at six.
- Returned marker and summary data are safe to mutate without changing source snapshots.
