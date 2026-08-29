# Data Model: Rendered Project Company Office

## RenderedOfficeComposition

- `bounds`: World-space dimensions for the composition.
- `companyName`: Dynamic project/company identity shown on signage.
- `departments`: Required physical departments rendered in the office.
- `sharedSpaces`: Reception, central collaboration, lounge, corridors, and supporting common spaces.
- `workplaceAnchors`: Named anchor points for employee/NPC placement.
- `density`: Counts of visible furniture/workstation primitives for stable acceptance tests.

## RenderedDepartment

- `kind`: One of `engineering`, `review`, `validation-qa`, or `project-status-operations`.
- `label`: Secondary signage text.
- `bounds`: Physical room/area bounds.
- `workstations`: Visible workstation compositions in the department.
- `fixtures`: Boards, shelves, QA equipment, status displays, or planning furniture that make the area recognizable without text labels.

## RenderedWorkstation

- `id`: Stable semantic workstation id.
- `kind`: Engineering, review, validation, or operations use.
- `position`: Visible world-space position used by furniture and employee placement.
- `monitorCount`: Number of rendered monitors/screens at the station.

## WorkplaceAnchor

- `id`: Stable destination id such as engineering workstation 1, review workstation, validation workstation 1, operations workstation, or lounge.
- `zone`: Existing NPC logical zone mapping.
- `slot`: Existing NPC logical slot.
- `position`: World-space placement aligned to visible furniture.
