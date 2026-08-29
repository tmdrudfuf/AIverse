# Contract: Physical Department Office Composition

## OfficeLayoutService

### `getDepartmentAreas(layoutId?: string): OfficeDepartmentArea[]`

Returns a defensive copy of department areas for the requested layout or the active layout by default.

### `getLayoutForStage(stage)`

Returned snapshots include `departmentAreas`. The `growingCompany` stage includes four locked future department areas for frontend engineering, backend engineering, design, and QA.

## Invariants

- Returned department arrays and nested arrays are not shared with configured layout definitions.
- Department position hints reuse the same floor and zone conventions as existing zones and slots.
- Existing callers that ignore department metadata continue to receive valid layout snapshots.
