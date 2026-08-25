# Data Model: Browser-Persisted External Project Registration State

## BrowserOfficeSessionSnapshot

Existing browser-saved office state. Extended with:

- `projectRegistryEntries?: ProjectRegistryEntry[]`

Validation rules:

- Missing `projectRegistryEntries` is valid and means "use default registry state".
- Present `projectRegistryEntries` must be an array.
- Each accepted entry must pass the `ProjectRegistryEntry` validation rules below.
- Invalid entries are ignored.

## ProjectRegistryEntry

Existing project registry metadata persisted through browser session state.

Required fields:

- `id`: non-empty string
- `displayName`: non-empty string
- `shortDescription`: string
- `lifecycleStatus`: `Active`, `Planned`, or `Coming Soon`
- `projectType`: string
- `localRepository.connected`: boolean
- `localRepository.label`: string
- `repositoryIdentity.provider`: string
- `repositoryIdentity.connectionState`: `Configured`, `Available`, `Unavailable`, or `Unknown`
- `owner.companyName`: string
- `createdAt`: string
- `lastActivityAt`: string

Optional nested fields:

- `localRepositoryBinding`: normalized local repository metadata
- `remoteRepository`: public/private repository reference metadata
- `repositoryIdentity.owner`, `name`, `defaultBranch`, `url`, `localPath`, `lastVerifiedAt`

State transitions:

- Save: project registry entries are cloned into the browser session snapshot.
- Restore: valid saved entries replace or extend default registry entries by project ID, then portal projects and repository mappings are rebuilt from the merged entries.
- Invalid restore: malformed entries are skipped and default state remains usable.

## Repository Mapping

Derived state produced from restored registry entries when `remoteRepository` exists. Not stored independently for this feature.
