# Data Model: Claude Implementer Runtime Foundation

## ImplementerRuntimeStatus

`"Completed" | "TimedOut" | "Cancelled" | "Blocked" | "Failed"` — no `Starting`/`Running` member (see plan.md, Architecture Decision 1). `Cancelled` has no reachable product-code trigger in this spec; it exists only so the type is forward-compatible with a future coherent cancellation path.

## ImplementerRuntimeReasonCode

`IMPLEMENTER_RUNTIME_*`-prefixed, mirroring Runtime Start's own (074) prefixed convention:

- `IMPLEMENTER_RUNTIME_STARTED` (success)
- `IMPLEMENTER_RUNTIME_ALREADY_ACTIVE`
- `IMPLEMENTER_RUNTIME_MALFORMED`
- `IMPLEMENTER_RUNTIME_PLAN_INVALID`
- `IMPLEMENTER_RUNTIME_READINESS_NOT_READY`
- `IMPLEMENTER_RUNTIME_APPROVAL_MISSING`
- `IMPLEMENTER_RUNTIME_APPROVAL_STALE`
- `IMPLEMENTER_RUNTIME_PREFLIGHT_NOT_READY`
- `IMPLEMENTER_RUNTIME_START_MISSING`
- `IMPLEMENTER_RUNTIME_START_STALE`
- `IMPLEMENTER_RUNTIME_INVALID_ACTOR`
- `IMPLEMENTER_RUNTIME_ROLE_MISMATCH`
- `IMPLEMENTER_RUNTIME_CLAUDE_NOT_IMPLEMENTER`
- `IMPLEMENTER_RUNTIME_CODEX_REVIEWER_MISMATCH`
- `IMPLEMENTER_RUNTIME_COMMAND_UNSAFE`
- `IMPLEMENTER_RUNTIME_WORKTREE_MISMATCH`
- `IMPLEMENTER_RUNTIME_BRANCH_MISMATCH`
- `IMPLEMENTER_RUNTIME_SPEC_MISMATCH`
- `IMPLEMENTER_RUNTIME_MUTATION_SCOPE_MISMATCH`
- `IMPLEMENTER_RUNTIME_ALREADY_COMPLETED`
- `IMPLEMENTER_RUNTIME_PROVIDER_UNAVAILABLE`
- `IMPLEMENTER_RUNTIME_SPAWN_FAILED`
- `IMPLEMENTER_RUNTIME_TIMED_OUT`
- `IMPLEMENTER_RUNTIME_CANCELLED`
- `IMPLEMENTER_RUNTIME_NONZERO_EXIT`
- `IMPLEMENTER_RUNTIME_OUTPUT_INVALID`
- `IMPLEMENTER_RUNTIME_PROJECT_MISMATCH`
- `IMPLEMENTER_RUNTIME_INTERNAL_FAILURE`

## ImplementerRuntimeRoleBinding

Explicit request data, not derived from `plan.implementerAgent`/`reviewerAgent` (see plan.md, Architecture Decision 3):

- `approvedImplementerAgent: string` (controller constant, `"claude"`)
- `approvedReviewerAgent: string` (controller constant, `"codex"`)

## ImplementerRuntimeCommandConfig

- `command: string` (`"claude"`)
- `arguments: string[]` (`["--dangerously-skip-permissions", "-p", "{{prompt}}"]`, placeholder substituted at invocation time)
- `inputMode: "argument" | "stdin"` (`"argument"`)
- `timeoutMs: number` (bounded, positive, rejecting negative/zero/unbounded/excessive values)

## ImplementerPrompt

- `promptId: string`, deterministic: `<projectId>:implementer-prompt:<runtimeStartId>:claude-implementer-v1`
- `text: string`, bounded length, built only from: featureId/specPath, projectId, taskId, Execution Plan summary (worktree, branch), Implementer/Reviewer role labels, `approvedImplementerAgent`/`approvedReviewerAgent`, validation commands, mutation scope, explicit stop-condition/prohibition clauses.
- Immutable; constructed via a pure function, never mutated after creation.

## ImplementerRuntimeEvidence

Bounded, sanitized, defensively-copied:

- `providerId: string` (`"claude"`)
- `agentId: string` (`"Claude"`)
- `role: "Implementer"`
- `commandDisplay: string` (command + arguments joined for display, never containing prompt secrets)
- `workingDirectory: string`
- `started: boolean`
- `completed: boolean`
- `timedOut: boolean`
- `cancelled: boolean`
- `exitCode?: number`
- `signal?: string`
- `durationMs: number`
- `stdoutSummary: string` (truncated, sanitized)
- `stderrSummary: string` (truncated, sanitized)
- `outputTruncated: boolean`

## ImplementerRuntime

- `implementerRuntimeId: string`, deterministic: `<projectId>:implementer-runtime:<runtimeStartId>:claude-implementer-v1`
- `projectId`
- `runtimeStartId`
- `executionPlanId`
- `humanExecutionApprovalId`
- `runtimePreflightId`
- `taskId`, `confirmedAssignmentId`, `preparedSessionId`, `activeSessionId`, `employeeId`, `repositoryId`
- `worktreePath`, `branch`, `specificationPath`
- `implementer`, `reviewer` (the generic pipeline role labels, carried forward unchanged for consistency checks)
- `approvedImplementerAgent`, `approvedReviewerAgent`
- `promptId`
- `status: ImplementerRuntimeStatus`
- `startedBy: string`, `startedAt: string`
- `executionStarted: true`
- `agentStarted: boolean` (real boolean — true only after confirmed spawn)
- `implementerStarted: boolean` (real boolean — mirrors `agentStarted`)
- `reviewerStarted: false` (literal type)
- `validationStarted: false` (literal type)
- `repositoryMutationStarted: false` (literal type — this spec permits only local file edits by the Claude subprocess itself, never a controller-initiated repository mutation; see plan.md)
- `githubMutationStarted: false` (literal type)
- `evidence: ImplementerRuntimeEvidence`
- `rulesVersion: string`

## ImplementerRuntimeResult

- `id`, `projectId`, `runtimeStartId`, `executionPlanId`
- `implementerRuntimeId?: string`
- `status: ImplementerRuntimeStatus`
- `reasonCodes: ImplementerRuntimeReasonCode[]`
- `started: boolean`
- `duplicateActiveAttempt: boolean`
- `agentStarted: boolean`, `implementerStarted: boolean`
- `reviewerStarted: false`, `validationStarted: false`, `repositoryMutationStarted: false`, `githubMutationStarted: false`
- `resultAt: string`
- `rulesVersion: string`

## Validation Rules

- Plan, readiness, approval, preflight, and Runtime Start must all match the same project and exact context (mirrors `RuntimeStartService.validateContext`, reused as a precondition — Runtime Start itself is re-derived fresh, not trusted from a cached collection).
- Runtime Start must have status `Started` or `AlreadyStarted`, with `agentStarted`/`implementerStarted`/`reviewerStarted`/`validationStarted`/`githubMutationStarted` all false at the moment Implementer Runtime is requested.
- `approvedImplementerAgent` must equal `"claude"`, `approvedReviewerAgent` must equal `"codex"`, and the two must differ; the generic `implementer`/`reviewer` labels on plan/approval/preflight/Runtime Start must be internally consistent (unchanged from `RuntimeStartService`'s own equality checks).
- The configured Claude command must equal the approved command configuration exactly, and must pass both `isSafeCommandLine` (reused from Runtime Preflight) and this feature's additional shell-chaining/substitution/encoded-command/traversal checks.
- Working directory must equal the Runtime Start's `worktreePath`/`branch`/`specificationPath`/`repositoryRoot` exactly.
- Actor must be a human label and must not be Claude, Codex, agent, bot, automation, or workflow.
- An active (unresolved) attempt for the same `runtimeStartId` blocks a duplicate start; the provider is never invoked twice for one Runtime Start without an intervening explicit action after a terminal result.
- Blocked and Failed results never set `agentStarted`/`implementerStarted` true and never create an `ImplementerRuntime` record — only a result.
- `reviewerStarted`, `validationStarted`, and `githubMutationStarted` are false on every record and result, unconditionally.
