# Feature Specification: Local Project Repository Binding

**Feature Branch**: `codex/102-local-project-repository-binding`

**Created**: 2026-08-15

**Status**: Draft

**Input**: User description: "Local Project Repository Binding"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Bind a project to local repository metadata (Priority: P1)

As an AIverse operator preparing a local implementation workflow, I can attach a registered project to configured local repository metadata so downstream execution planning can see the intended repository path, worktree path, branch, and spec path.

**Why this priority**: Without an explicit local binding, later workflow stages only see sparse configured identity and cannot distinguish the intended local worktree from unknown repository state.

**Independent Test**: Apply a local binding to Daily Proof and confirm the registry entry and portal project expose the configured path and branch metadata without attempting a filesystem read.

**Acceptance Scenarios**:

1. **Given** Daily Proof has configured GitHub identity but no local path, **When** a local binding is applied, **Then** Daily Proof remains GitHub-identified and gains local repository/worktree metadata.
2. **Given** a binding includes repository path, worktree path, branch, and spec path, **When** portal state is created with that binding, **Then** the matching project exposes the same configured metadata.

---

### User Story 2 - Reject unsafe or incomplete bindings (Priority: P2)

As an operator, I receive safe, deterministic feedback when local binding input is incomplete or references an unknown project.

**Why this priority**: Binding data feeds later runtime planning, so missing project IDs or paths must be rejected before they are presented as usable metadata.

**Independent Test**: Attempt to bind an unknown project and a blank path; confirm no registry state changes and the failure reason is explicit.

**Acceptance Scenarios**:

1. **Given** no registered project matches the binding's project ID, **When** the binding is applied, **Then** the registry entries are returned unchanged with an `UnknownProject` result.
2. **Given** a binding omits both repository path and worktree path, **When** it is applied, **Then** the registry entries are returned unchanged with a `MissingLocalPath` result.

---

### User Story 3 - Preserve safe copy boundaries (Priority: P3)

As a developer extending repository workflow features, I can rely on local binding metadata being cloned like other registry data instead of shared by reference.

**Why this priority**: The registry already protects seed data and nested identity objects; local binding metadata must preserve that guarantee.

**Independent Test**: Mutate a returned bound entry and confirm a later read returns the original configured metadata.

**Acceptance Scenarios**:

1. **Given** a project registry has a bound local repository, **When** a caller mutates a returned entry's binding metadata, **Then** the registry's internal entry remains unchanged.

### Edge Cases

- A binding provides only a worktree path: the repository path falls back to the worktree path.
- A binding provides only a repository path: the worktree path falls back to the repository path.
- A binding targets a project with existing remote identity: remote owner/name/url/default branch remain unchanged.
- Binding metadata is configured data only; it does not prove the path exists, read git state, run git commands, or mutate a repository.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a deterministic local project repository binding operation keyed by registered project ID.
- **FR-002**: A successful binding MUST record configured repository path, worktree path, branch name, spec path, source label, and configured timestamp when provided.
- **FR-003**: A successful binding MUST set `repositoryIdentity.localPath` to the configured worktree path while preserving existing provider, owner, name, URL, and default branch data.
- **FR-004**: A successful binding MUST update the existing local repository display metadata to indicate the project is locally bound.
- **FR-005**: The binding operation MUST reject unknown project IDs and bindings without any usable local path without changing registry entries.
- **FR-006**: The binding operation MUST NOT read the filesystem, spawn subprocesses, call git or GitHub, validate path existence, or mutate any repository.
- **FR-007**: Project portal state creation MUST accept optional local bindings and expose successful bindings through existing project registry entries and portal projects.
- **FR-008**: Bound local metadata MUST be deep-cloned by registry reads and adapters so callers cannot mutate internal registry state.

### Key Entities

- **LocalProjectRepositoryBinding**: Configured metadata for one project: project ID, repository path, worktree path, branch name, spec path, source, and bound timestamp.
- **LocalProjectRepositoryBindingResult**: Success or failure result for each attempted binding, including reason codes for rejected input.
- **ProjectRegistryEntry**: Existing registered project model extended to carry optional local binding metadata.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A local binding can be applied to Daily Proof and read back from portal state with exact configured path, branch, and spec values.
- **SC-002**: Unknown-project and missing-path binding attempts leave all project entries unchanged and return explicit failure reasons.
- **SC-003**: Mutating a returned bound entry does not alter future registry reads.
- **SC-004**: No source code in the feature imports `fs`, `child_process`, `node:*`, or invokes git/GitHub commands.

## Assumptions

- The binding records configured local metadata for later workflow layers; verified repository state remains owned by repository synchronization snapshots.
- A local binding does not make a local repository provider available in the browser runtime.
- The feature accepts bindings through code-level options for now; user-facing binding UI, persistent settings, and environment-variable loading are out of scope.
