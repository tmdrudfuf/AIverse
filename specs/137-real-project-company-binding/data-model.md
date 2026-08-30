# Data Model: Real Project Company Binding

## ProjectCompanyBinding

- `bindingId`: Stable binding id, typically derived from the city building id.
- `buildingId`: City building/company identifier.
- `projectId`: Canonical registered project id.
- `companyName`: Display company/project title derived from registry where available.
- `status`: `bound` or `unavailable`.
- `unavailableReason`: Present when the registered project cannot be resolved or its local metadata is stale.

## ActiveProjectCompanyContext

- `binding`: Project-company binding.
- `project`: Registered project metadata when available.
- `projectId`: Requested project id, even when unavailable.
- `displayName`: Project display identity for office title/status.
- `companyName`: Company/owner identity for signage.
- `localRepositoryBinding`: Registered local path/worktree/branch/spec metadata when available.
- `repositoryIdentity`: Provider-neutral repository identity when available.

## RegisteredProject

Uses the existing project registry entry as source of truth:

- `id`
- `displayName`
- `owner.companyName`
- `localRepository`
- `localRepositoryBinding`
- `repositoryIdentity`
- `remoteRepository`
- lifecycle status and metadata

## State Rules

- A visible project company maps to one `projectId`.
- Active office context is set from selected company before portal/status/live visualization reads state.
- ADOS/run collections are selected only by active `projectId`.
- Missing bindings remain unavailable and never resolve to another project.
