# Data Model: Spec 082 - Validation Runtime Foundation

## ValidationRuntime

Immutable record for one explicit validation attempt against a completed Review Fix Runtime. Includes project/task identities, execution plan, review-fix request/plan/runtime/result IDs, repository/worktree/branch, expected HEAD, validation command snapshot, status, command evidence, lifecycle flags, and rules version.

## ValidationRuntimeResult

Immutable result summary with deterministic project-scoped ID, runtime linkage when a runtime was created, status, reason codes, command counts, started flags, mutation flags, and result timestamp.

## ValidationRuntimeEvidence

Immutable command evidence containing provider ID, working directory, expected HEAD, command outcomes, timeout information, stdout/stderr summaries, truncation markers, and aggregate success/failure counts.

## ValidationCommandEvidence

Immutable evidence for one configured command execution. It records command display, execution state, exit code or signal, timeout state, duration, and bounded output summaries.
