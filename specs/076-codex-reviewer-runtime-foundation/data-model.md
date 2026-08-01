# Data Model: Codex Reviewer Runtime Foundation

## ReviewerRuntimeStatus

`"Completed" | "TimedOut" | "Blocked" | "Failed"` — no `Starting`/`Running`/`Cancelled` member (see plan.md, Architecture Decision 3). Truthful process-lifecycle status only; kept strictly separate from `ReviewerRuntimeDecision`.

## ReviewerRuntimeDecision

`"Approved" | "ChangesRequested" | "Unknown"` — the normalized outcome of `ReviewDecisionParser.parseReviewOutput`, independent of `ReviewerRuntimeStatus`. `status: "Completed"` and `decision: "ChangesRequested"` are both true at once whenever Codex ran to completion and asked for changes.

## ReviewerRuntimeReasonCode

`REVIEWER_RUNTIME_*`-prefixed, mirroring the Implementer Runtime's (075) prefixed convention:

- `REVIEWER_RUNTIME_STARTED` (success)
- `REVIEWER_RUNTIME_MALFORMED`
- `REVIEWER_RUNTIME_PLAN_INVALID`
- `REVIEWER_RUNTIME_READINESS_NOT_READY`
- `REVIEWER_RUNTIME_APPROVAL_STALE`
- `REVIEWER_RUNTIME_PREFLIGHT_NOT_READY`
- `REVIEWER_RUNTIME_START_STALE`
- `REVIEWER_RUNTIME_IMPLEMENTER_MISSING`
- `REVIEWER_RUNTIME_IMPLEMENTER_NOT_COMPLETED`
- `REVIEWER_RUNTIME_TARGET_MISSING`
- `REVIEWER_RUNTIME_TARGET_UNCOMMITTED`
- `REVIEWER_RUNTIME_TARGET_MISMATCH`
- `REVIEWER_RUNTIME_INVALID_ACTOR`
- `REVIEWER_RUNTIME_ROLE_MISMATCH`
- `REVIEWER_RUNTIME_CODEX_NOT_REVIEWER`
- `REVIEWER_RUNTIME_CLAUDE_REVIEWER_MISMATCH`
- `REVIEWER_RUNTIME_COMMAND_UNSAFE`
- `REVIEWER_RUNTIME_WORKTREE_MISMATCH`
- `REVIEWER_RUNTIME_BRANCH_MISMATCH`
- `REVIEWER_RUNTIME_SPEC_MISMATCH`
- `REVIEWER_RUNTIME_PROJECT_MISMATCH`
- `REVIEWER_RUNTIME_ALREADY_ACTIVE`
- `REVIEWER_RUNTIME_ALREADY_COMPLETED`
- `REVIEWER_RUNTIME_PROVIDER_UNAVAILABLE` (mapped from a provider `Blocked` result — this is what a spawn-allow env-var-gate block reports, distinct from the Service's own pre-invoke `REVIEWER_RUNTIME_COMMAND_UNSAFE`)
- `REVIEWER_RUNTIME_SPAWN_FAILED`
- `REVIEWER_RUNTIME_TIMED_OUT`
- `REVIEWER_RUNTIME_NONZERO_EXIT`
- `REVIEWER_RUNTIME_OUTPUT_INVALID`
- `REVIEWER_RUNTIME_DECISION_UNKNOWN` (status `Completed`, decision `Unknown`)
- `REVIEWER_RUNTIME_INTERNAL_FAILURE`

## ReviewerRuntimeRoleBinding

Explicit request data, not derived from `plan.implementerAgent`/`reviewerAgent` (see plan.md, Architecture Decision 2):

- `approvedImplementerAgent: string` (controller constant, `"claude"`)
- `approvedReviewerAgent: string` (controller constant, `"codex"`)

## ReviewerRuntimeCommandConfig

- `command: string` (`"codex"`)
- `arguments: string[]` (`["--sandbox", "danger-full-access", "--ask-for-approval", "never", "exec"]`)
- `inputMode: "argument" | "stdin"` (`"stdin"`)
- `timeoutMs: number` (bounded, positive, rejecting negative/zero/unbounded/excessive values; default `300000`)

## ReviewTarget

Deterministic, zero-I/O, always `"Uncommitted"` in this repository today (see plan.md, Architecture Decision 1; `ReviewTarget.ts`):

- `reviewTargetId: string`, deterministic: `<projectId>:review-target:<runtimeStartId>:<reviewTargetSha>:<rulesVersion>`
- `projectId`, `runtimeStartId`, `implementerRuntimeId`, `repositoryId`
- `worktreePath: string`, `baseBranch: string` (`"main"`), `baseSha: string`
- `featureBranch: string`, `reviewTargetSha: string`, `mergeBaseSha: string`
- `workingTreeState: "Clean" | "Uncommitted"` (always `"Uncommitted"` from `resolveReviewTarget`; only a directly constructed test fixture can set `"Clean"`)
- `changedFiles: ReadonlyArray<string>` (always `[]` from `resolveReviewTarget`)
- `specificationPath: string`, `resolvedAt: string`, `rulesVersion: string`

## ReviewerPrompt

- `promptId: string`, deterministic: `<projectId>:reviewer-prompt:<reviewTargetId>:<rulesVersion>`
- `text: string`, bounded to 4000 characters, built only from: role statement, approved Implementer/Reviewer agent labels, project/feature/spec identifiers, worktree, base/feature branch + SHAs, review-target commit, merge base, a changed-file list capped at 25 entries (with an overflow count, never the full diff), and explicit stop-condition/prohibition clauses (no edit, no stage/commit/push, no PR, no merge, no GitHub mutation, no Claude invocation, no settings/config mutation) plus the required decision-marker format (see `contracts/prompt-contract.md`, "Review Input Boundary").
- Immutable; constructed via a pure function, never mutated after creation.

## ReviewerRuntimeFinding

Parsed from Codex's output by `ReviewDecisionParser` (see `contracts/output-decision-contract.md`):

- `findingId: string` (`finding-<n>`, 1-indexed within one result)
- `severity: "P1" | "P2" | "P3"` (unrecognized token fails safe to `"P1"`)
- `blocking: boolean` (explicit `blocking`/`non-blocking` token if present; otherwise `severity !== "P3"`; an unrecognized severity token is always treated as blocking)
- `category: string` (capped at 50 characters, defaults to `"general"`)
- `filePath?: string`, `line?: number` (capped at 200 characters; a path containing `..`, a drive-letter prefix, or a leading `/` is dropped rather than trusted)
- `message: string` (capped at 300 characters)
- `suggestion?: string` (capped at 300 characters)

Bounded by `MAX_FINDINGS = 20` per result.

## ReviewerRuntimeEvidence

Bounded, sanitized, defensively-copied:

- `providerId: string` (`"codex"`)
- `agentId: string`, `role: "Reviewer"`
- `commandDisplay: string` (command + arguments joined for display, never containing prompt secrets)
- `workingDirectory: string`, `reviewTargetSha: string`
- `started: boolean`, `completed: boolean`, `timedOut: boolean`
- `exitCode?: number`, `signal?: string`, `durationMs: number`
- `stdoutSummary: string`, `stderrSummary: string` (truncated at 2000 characters, sanitized)
- `outputTruncated: boolean`

## ReviewerRuntime

- `reviewerRuntimeId: string`, deterministic: `<projectId>:reviewer-runtime:<reviewTargetId>:<rulesVersion>`
- `projectId`, `runtimeStartId`, `implementerRuntimeId`, `reviewTargetId`, `reviewPromptId`
- `worktreePath`, `branch`, `specificationPath`
- `implementer`, `reviewer` (the generic pipeline role labels, carried forward unchanged for consistency checks)
- `approvedImplementerAgent`, `approvedReviewerAgent`
- `status: ReviewerRuntimeStatus`, `decision: ReviewerRuntimeDecision`
- `findings: ReadonlyArray<ReviewerRuntimeFinding>`
- `startedBy: string`, `startedAt: string`
- `executionStarted: true`
- `agentStarted: boolean` (real boolean — true only after confirmed spawn)
- `implementerStarted: true` (literal type — reflects the Implementer Runtime this review target is built from, not a new Implementer start)
- `reviewerStarted: boolean` (mirrors `agentStarted`)
- `validationStarted: false`, `repositoryMutationStarted: false`, `githubMutationStarted: false` (literal types)
- `evidence: ReviewerRuntimeEvidence`, `rulesVersion: string`

## ReviewerRuntimeResult

- `id`, `projectId`, `runtimeStartId?`, `implementerRuntimeId?`, `reviewerRuntimeId?`
- `status: ReviewerRuntimeStatus`, `decision: ReviewerRuntimeDecision`
- `blockingFindingCount: number`, `nonBlockingFindingCount: number`
- `reasonCodes: ReviewerRuntimeReasonCode[]`
- `started: boolean`, `duplicateActiveAttempt: boolean`
- `agentStarted: boolean`, `implementerStarted: true`, `reviewerStarted: boolean`
- `validationStarted: false`, `repositoryMutationStarted: false`, `githubMutationStarted: false`
- `resultAt: string`, `rulesVersion: string`

## Validation Rules

- Plan, readiness, approval, preflight, and Runtime Start must all match the same project and exact context (reused, unmodified, from the existing chain).
- The Implementer Runtime must exist, match the project, and be exactly `Completed`; one that already recorded `reviewerStarted`/`validationStarted`/`githubMutationStarted` true blocks (see plan.md, "Implementer Result Revalidation").
- `approvedImplementerAgent` must equal `"claude"`, `approvedReviewerAgent` must equal `"codex"`, and the two must differ; the generic `implementer`/`reviewer` labels on plan/approval/preflight/Runtime Start/Implementer Runtime must be internally consistent.
- The resolved `ReviewTarget` must match the project, Runtime Start, Implementer Runtime, worktree, branch, and spec path exactly, and its `workingTreeState` must be exactly `"Clean"` — never satisfied by `resolveReviewTarget`'s own deterministic output in this repository today (see plan.md, Architecture Decision 1).
- The configured Codex command must equal `DEFAULT_REVIEWER_RUNTIME_COMMAND_CONFIG` exactly, and must pass `isSafeReviewerCommand` (which itself composes `isSafeCommandLine`, `isSafeImplementerCommandLine`, and an unsafe-redirection check).
- Actor must be a human label and must not be Claude, Codex, agent, bot, automation, or workflow.
- An active (unresolved) attempt for the same review target blocks a duplicate start; the provider is never invoked twice for one review target without an intervening explicit action after a terminal result.
- Blocked and Failed results never set `agentStarted`/`reviewerStarted` true and never create a `ReviewerRuntime` record — only a result.
- `validationStarted` and `githubMutationStarted` are false on every record and result, unconditionally; `implementerStarted` is always `true`, reflecting the Implementer Runtime the review target derives from.
