# Data Model: Daily Proof Configured Runtime Repository Context

## DailyProofRuntimeRepositoryContext

Configured runtime repository metadata for the Daily Proof project.

| Field | Required | Notes |
|-------|----------|-------|
| `projectId` | Yes | Must be `daily-proof`. |
| `repositoryPath` | Yes | Primary AIverse repository root. |
| `worktreePath` | Yes | Feature worktree where implementation is allowed. |
| `branchName` | Yes | Feature branch for the runtime handoff. |
| `specPath` | Yes | Feature specification path inside the worktree. |
| `source` | Yes | Indicates the metadata source, e.g. ADOS handoff. |
| `boundAt` | Yes | Timestamp of the configured binding. |

## ExecutionPlanRepositoryContext

Existing execution-plan context populated from Daily Proof configured metadata.

| Field | Required | Notes |
|-------|----------|-------|
| `repositoryId` | Yes | Derived from the repository identity provider/owner/name. |
| `repositoryPath` | Yes | Must preserve the configured primary repository root. |
| `worktreePath` | Yes | Must preserve the configured feature worktree. |
| `branchName` | Yes | Comes from configured binding when available. |
| `specPath` | Yes | Comes from configured binding when available. |

## Validation Rules

- `repositoryPath` and `worktreePath` may differ and must not be collapsed.
- If a repository snapshot includes `currentBranch`, it must match `branchName`.
- If a repository snapshot omits `currentBranch`, configured `branchName` is acceptable.
- Copy boundaries remain owned by the project registry and execution-plan copy helpers.
