# Contract: Project Company Binding

## City Building Definition

A project-capable city building exposes a stable binding reference:

- `projectBinding.projectId`: canonical registered project id
- `projectBinding.bindingId`: stable binding id, defaults to building id when absent

## Entry Request

When a bound building is entered, the office spawn request carries:

- `buildingId`
- `projectId`
- `projectBindingId`
- `companyName`
- `officeSceneKey`
- return scene/position/facing

## Active Office Context

The office resolves spawn context against the existing project registry:

- If the project exists, use registered display/company/repository/local path metadata.
- If the project is missing or unavailable, expose unavailable context for the requested `projectId`.
- Do not substitute another project.

## Consumers

- Office signage uses active office context company/display name.
- Portal selection initializes to active context project id.
- Project Status/dashboard reads active project id.
- Live Agent Work Visualization reads active project id and project-keyed ADOS collections.
- Portal/development actions receive the active project id through existing controller state.
