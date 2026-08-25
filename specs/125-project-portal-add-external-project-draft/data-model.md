# Data Model: Project Portal Add External Project Draft Action

## Add External Project Action

- **Purpose**: A selectable Project Portal list action that creates or reselects the draft.
- **State**: Derived from the list selection index; no standalone persisted entity.
- **Validation**: Activation is valid only from the Project Portal list.

## External Project Draft

- **Purpose**: A placeholder external project that can later be edited or bound to a repository.
- **Fields**:
  - `id`: Stable draft project id.
  - `displayName`: Human-readable draft name.
  - `shortDescription`: Draft description shown in portal details.
  - `lifecycleStatus`: Planned.
  - `projectType`: External.
  - `localRepository`: Not connected.
  - `repositoryIdentity`: Local provider with unknown connection state.
  - `owner`: AIverse operator-facing owner label.
  - `createdAt` and `lastActivityAt`: Stable timestamps for deterministic draft metadata.
- **Relationships**:
  - Appears in `ProjectPortalState.projectRegistryEntries`.
  - Derives one row in `ProjectPortalState.projects`.
  - Does not derive a repository mapping because no remote repository is known.

## Project Portal State

- **Purpose**: Existing in-memory and browser-persisted portal state.
- **State transitions**:
  - Before activation: default registry entries only, unless prior browser state restored entries.
  - First activation: append external project draft, rebuild project rows, select the draft, and save browser state when available.
  - Repeated activation: keep one draft, select it, and save browser state when available.
