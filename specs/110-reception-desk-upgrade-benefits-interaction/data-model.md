# Data Model: Reception Desk Upgrade Benefits Interaction

## ReceptionUpgradeBenefits

Represents the passive benefits shown in the workspace after reception unlock.

**Fields**:

- `source`: Fixed source label identifying the reception desk upgrade.
- `level`: Company level that enabled the benefits.
- `heading`: Short display heading for the benefits section.
- `summary`: One-sentence description of the unlock.
- `benefits`: Stable list of user-facing benefit rows.

**Validation Rules**:

- Created only when company level is 2 or higher.
- Created only when `unlockedOfficeZones` includes `reception`.
- Must contain at least three benefit rows.
- Must not include command or runtime-start affordances.

## CompanyProgressionSnapshot

Existing progression state used as input for benefit derivation.

**Relevant Fields**:

- `companyLevel`
- `unlockedOfficeZones`
- `maxEmployees`
- `layoutId`
