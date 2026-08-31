# Data Model: Multi-Project Company Operations

## ProjectOperationalStatus

- `buildingId`: city building id displaying the status
- `projectId`: canonical registered project id when available
- `projectName`: registered project display name when available
- `companyName`: company/building display name
- `stage`: one of idle, preparing, implementation, validation, review, publication, blocked, complete, disconnected
- `label`: concise city-facing label
- `tone`: active, warning, complete, idle, or disconnected
- `reasonText`: optional concise blocked/disconnected reason
- `updatedAt`: optional last status timestamp
- `mutationDisabled`: true when the bound project cannot be safely mutated

## Relationships

- One city building may have one project company binding.
- One project company binding resolves to one canonical project id or an unavailable state.
- One project id may have zero or one current/recent persisted ADOS city status projection.
- Missing project-specific run state means idle for available projects, never fallback to another project.

## State Mapping

- Missing available project status maps to idle.
- Prepared or not-prepared run records map to preparing.
- Started execution maps to implementation unless the status text identifies validation, review, or publication.
- Failed, timed out, cancelled, blocked, or recovery statuses map to blocked.
- Completed maps to complete.
- Missing or unavailable registry/binding maps to disconnected and disables mutation.
