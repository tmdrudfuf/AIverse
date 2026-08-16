# Contract: Runtime Repository Context

## Execution Plan Creation

When Daily Proof has configured local binding metadata, execution plan creation receives repository context with:

```text
repositoryId: github:ai-verse/daily-proof
repositoryPath: C:/Users/tmdru/Desktop/Ky-Project/AIverse
worktreePath: C:/Users/tmdru/Desktop/Ky-Project/AIverse-daily-proof-configured-runtime-repository-context
branchName: codex/103-daily-proof-configured-runtime-repository-context
specPath: specs/103-daily-proof-configured-runtime-repository-context/spec.md
```

## Branch Evidence Contract

- If repository evidence has no `currentBranch`, the configured `branchName` is accepted.
- If repository evidence has `currentBranch`, it must equal configured `branchName`.
- A mismatch returns the existing branch-blocking behavior and must not start runtime execution.

## Runtime Start Contract

Runtime start must copy the execution plan's repository root, worktree path, branch, spec path, validation commands, and mutation scope without recomputing them.
