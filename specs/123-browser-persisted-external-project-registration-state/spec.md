# Feature Specification: Browser-Persisted External Project Registration State

**Feature Branch**: `codex/123-browser-persisted-external-project-registration-state`

**Created**: 2026-08-24

**Status**: Draft

**Input**: User description: "Browser-Persisted External Project Registration State"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Restore externally registered projects after reload (Priority: P1)

As an AIverse operator who has registered an external project during a browser session, I can reload the app and still see that project in the project portal with its owner, local repository label, repository identity, and optional local binding metadata intact.

**Why this priority**: External project registration only becomes useful when the registered project survives the browser lifecycle; otherwise every reload loses the company project state.

**Independent Test**: Save a portal state containing a registered external project through browser session storage, restore a fresh state from that storage, and confirm the project, registry entry, and repository mapping are present.

**Acceptance Scenarios**:

1. **Given** a portal state contains a registered external project, **When** browser session state is saved and a new portal state is created from the same browser storage, **Then** the external project appears in `projects` and `projectRegistryEntries`.
2. **Given** the persisted external project has a public remote repository, **When** the restored state is inspected, **Then** `repositoryMappings` includes a mapping for that project derived from the persisted registry entry.

---

### User Story 2 - Ignore unsafe saved project records (Priority: P2)

As an operator, I want corrupted or incomplete browser-saved project registration data to be ignored safely so the portal still opens with the default registry rather than crashing or accepting malformed project metadata.

**Why this priority**: Browser storage can be edited, stale, or partially written, and project metadata feeds later repository workflow screens.

**Independent Test**: Store a current-version browser session snapshot with malformed `projectRegistryEntries`, restore state, and confirm default projects remain unchanged and malformed entries are excluded.

**Acceptance Scenarios**:

1. **Given** browser storage contains malformed project registry entries, **When** portal state is restored, **Then** the restore succeeds and keeps only valid default registry state.
2. **Given** a saved external project omits required identity fields, **When** the snapshot is loaded, **Then** that project is not registered into restored portal state.

---

### User Story 3 - Preserve copy boundaries for persisted projects (Priority: P3)

As a developer extending external project registration, I can rely on browser-restored registry entries being cloned so caller mutations do not alter the saved snapshot object or shared state references.

**Why this priority**: The project registry already protects mutable boundaries; browser persistence must preserve the same safety guarantee.

**Independent Test**: Restore a persisted external project, mutate the returned portal project and registry entry, restore again from storage, and confirm the original saved values remain intact.

**Acceptance Scenarios**:

1. **Given** a valid saved external project is restored, **When** code mutates the restored project or registry entry, **Then** a later restore from the same storage returns the original saved values.

### Edge Cases

- A saved project ID already exists in the default registry: the restored record replaces the default registry entry by ID only when the saved entry is valid, so browser state can preserve deliberate registration updates without creating duplicates.
- A saved project has no remote repository: it is restored into the registry and project list but produces no repository mapping.
- Browser storage is missing, unavailable, malformed JSON, wrong-version, or throws: the app continues with default in-memory project state.
- Saved registry entries are configured metadata only; restore does not read the filesystem, call GitHub, run git, or mutate any repository.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Browser office session snapshots MUST include project registry entries when saving project portal state.
- **FR-002**: Restoring a browser office session MUST rebuild `projectRegistryEntries`, `projects`, and `repositoryMappings` from valid saved registry entries.
- **FR-003**: Restoring saved registry entries MUST preserve owner company, local repository label, local repository binding, repository identity, remote repository metadata, lifecycle status, type, description, and timestamps.
- **FR-004**: Restoring saved registry entries MUST ignore malformed, incomplete, or unsafe records without throwing.
- **FR-005**: Restoring saved registry entries MUST keep default project state when no valid saved registry data is present.
- **FR-006**: Persisted registry data MUST be cloned on save, load, and restore so later mutations do not alter stored state or shared references.
- **FR-007**: The persistence feature MUST NOT read local files, spawn subprocesses, call GitHub, validate path existence, or mutate any repository.

### Key Entities

- **Browser Office Session Snapshot**: The browser-saved office state extended with project registry entries.
- **ProjectRegistryEntry**: Existing registered project metadata that must survive browser session save and restore.
- **Repository Mapping**: Existing dashboard repository mapping derived from restored registry entries when remote repository metadata exists.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A saved external project is visible in a freshly restored portal state in under one reload cycle.
- **SC-002**: Restored project registry entries exactly preserve required metadata fields for valid saved external projects.
- **SC-003**: Malformed saved project registry data causes zero thrown errors and zero malformed projects in restored portal state.
- **SC-004**: Mutating restored project state does not change a subsequent restore from the same browser storage.

## Assumptions

- External project registration already exists as code-level `ProjectRegistryService.registerProject(entry)` capability; this feature persists and restores that state through browser office session storage.
- No user-facing add-project UI is introduced in this slice.
- Browser persistence remains local to the current browser storage mechanism and does not synchronize across devices or users.
