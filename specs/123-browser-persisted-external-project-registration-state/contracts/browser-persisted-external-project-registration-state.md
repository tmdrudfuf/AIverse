# Contract: Browser-Persisted External Project Registration State

## Save Contract

When `BrowserOfficeSessionService.saveState(state)` receives a portal state:

- It writes `projectRegistryEntries` into the saved snapshot.
- Entries are cloned before serialization.
- Derived `projects` and `repositoryMappings` are not stored as authoritative registry data.

## Restore Contract

When `BrowserOfficeSessionService.restoreState(state)` loads a current-version snapshot:

- If the snapshot contains valid `projectRegistryEntries`, restored portal state includes those entries.
- `state.projects` is rebuilt from restored registry entries.
- `state.repositoryMappings` is rebuilt from restored registry entries with remote repository metadata.
- `selectedProjectIndex` is recalculated after restored projects are applied.
- If snapshot registry data is absent or invalid, default registry-derived state remains available.

## Safety Contract

Restore must not:

- Read from the filesystem
- Spawn subprocesses
- Run git commands
- Call GitHub or any network API
- Mutate any repository
