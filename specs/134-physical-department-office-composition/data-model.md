# Data Model: Physical Department Office Composition

## OfficeDepartmentArea

- `departmentId`: Stable identifier for the physical department area.
- `departmentKind`: Department responsibility such as frontend engineering, backend engineering, design, or QA.
- `label`: Human-readable department name.
- `floorId`: Office floor containing the department.
- `zoneId`: Layout zone containing the department.
- `positionHint`: Existing layout position hint for placement.
- `workstationSlotIds`: Workstation slots associated with the department.
- `meetingSlotIds`: Meeting slots associated with the department.
- `isUnlocked`: Whether the department area is currently available in the layout.

## OfficeLayoutSnapshot

Adds `departmentAreas: OfficeDepartmentArea[]` while preserving existing zones, furniture, workstation, meeting, break, and entry/exit data.
