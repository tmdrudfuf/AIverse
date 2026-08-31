# Contract: City Project Operations Status

## Purpose

Expose project-scoped operational status for each city company/building.

## Input

- City building definitions with optional project binding metadata.
- Current registered project entries from the existing registry.
- Current project-company bindings resolved by the existing binding service.
- Existing browser office session snapshot containing project-scoped ADOS statuses.

## Output

For each building, return:

- `buildingId`
- `projectId` when safely resolved
- `stage`: idle, preparing, implementation, validation, review, publication, blocked, complete, or disconnected
- `label`: concise visual label
- `tone`: visual tone for city rendering
- `reasonText` when blocked or disconnected
- `mutationDisabled` for disconnected/unavailable projects

## Invariants

- Status lookup is keyed only by the building's canonical project id.
- A newer run for another project is ignored.
- Missing project-specific status yields idle for available projects.
- Missing/unavailable project binding yields disconnected and disables mutation.
