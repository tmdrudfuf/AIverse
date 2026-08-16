# Data Model: Local Project Repository Binding

## LocalProjectRepositoryBinding

- `projectId`: registered AIverse project ID to bind.
- `repositoryPath`: configured local repository root, optional when `worktreePath` is supplied.
- `worktreePath`: configured local worktree path, optional when `repositoryPath` is supplied.
- `branchName`: configured current branch for downstream workflow display/planning.
- `specPath`: configured Spec Kit path for the active feature.
- `source`: label describing where the configured binding came from.
- `boundAt`: timestamp supplied by the caller.

Validation rules:

- `projectId` must be non-empty.
- At least one of `repositoryPath` or `worktreePath` must be non-empty.
- Paths are normalized by trimming only; no existence check is performed.
- Missing repository path falls back to worktree path; missing worktree path falls back to repository path.

## LocalProjectRepositoryBindingResult

- `projectId`: project ID from the attempted binding.
- `status`: `Bound` or `Rejected`.
- `reason`: `UnknownProject` or `MissingLocalPath` when rejected.
- `binding`: normalized binding when bound.

## ProjectRegistryEntry

Extended with optional `localRepositoryBinding`. Successful binding also updates:

- `localRepository.connected = true`
- `localRepository.label = "Bound (local)"`
- `repositoryIdentity.localPath = binding.worktreePath`
- `repositoryIdentity.connectionState = "Configured"` unless the existing state is already `Available`

Existing provider, owner, name, URL, and default branch values are preserved.
