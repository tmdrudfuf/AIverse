# Contract: Rendered Project Company Office

## Runtime Rendering Contract

- Entering a project company office renders a new physical office composition using Phaser runtime drawing.
- The composition includes recognizable Engineering, Review, Validation/QA, Project Status/Operations, reception, lounge/shared areas, corridors, walls/partitions, and supporting furniture.
- Department labels are secondary; each required department has distinct physical furniture and equipment.
- Company signage derives from `OfficeDefinition.companyName`.
- Existing tilemap collision, exit, navigation, project portal interaction, ADOS portal surfaces, and employee/NPC rendering remain functional.

## Semantic Contract

- `createRenderedOfficeComposition(office)` returns all required department kinds.
- Engineering exposes at least four workstation anchors.
- Review exposes at least one reviewer workstation anchor.
- Validation/QA exposes at least two validation workstation anchors.
- Project Status/Operations exposes at least one operations workstation anchor.
- NPC logical zones map to visible physical anchors rather than the old shared-computer cluster.

## Visual Evidence Contract

- Review evidence should include a runtime screenshot from the actual project office when tooling permits.
- The screenshot should be compared against the authoritative requirements and `docs/visual-references/office-reference.png`.
