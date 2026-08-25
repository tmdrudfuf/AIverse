# Research: Browser-Persisted External Project Registration State

## Decision: Persist registry entries in the existing browser office session snapshot

**Rationale**: `BrowserOfficeSessionService` already owns local browser save/load behavior for office state, and `createProjectPortalState()` already restores through that service after constructing default state. Extending the snapshot with `projectRegistryEntries` keeps project metadata in the same browser persistence boundary as selected project, task collections, employees, and work sessions.

**Alternatives considered**: A new storage key was rejected because it would split one logical office session across multiple snapshots and create ordering questions during restore. A backend or file store was rejected as out of scope.

## Decision: Treat missing saved registry entries as backward-compatible default state

**Rationale**: Existing snapshots do not contain registry entries. Restore should continue to accept those snapshots and leave default project registry state untouched.

**Alternatives considered**: Bumping the schema version was rejected because no incompatible migration is needed.

## Decision: Validate registry entry shape before restoring

**Rationale**: Browser storage is user-editable and may contain stale or malformed data. Project registry entries feed repository-facing UI state, so restore should accept only complete, structurally safe records.

**Alternatives considered**: Trusting parsed JSON was rejected because it would allow malformed nested records to reach portal state. Throwing on bad entries was rejected because a bad browser snapshot should not block app startup.
