# Requirements Checklist: Runtime Preflight Foundation

- [x] Explicit preflight action is required.
- [x] Human approval alone does not run preflight automatically.
- [x] Preflight success does not start execution.
- [x] Plan, readiness, approval, and runtime evidence are revalidated in order.
- [x] Provider interface separates runtime evidence from controller/domain logic.
- [x] Repository, worktree, branch, working tree, specification, agent, validation-command, mutation-scope, and runtime-environment checks are represented.
- [x] Unsafe commands validate command and arguments together.
- [x] Preflight records and results are immutable and deterministic.
- [x] Dashboard wording avoids execution/runtime-start claims.
- [x] Product code does not run validation commands or mutate repository/GitHub state.
