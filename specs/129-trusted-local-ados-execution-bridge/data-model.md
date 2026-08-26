# Data Model: Trusted Local ADOS Execution Bridge

## TrustedLocalAdosExecution

Represents a single trusted local implementer attempt for an external project ADOS preparation.

### Fields

- `id`: Stable execution id derived from project id and preparation id.
- `projectId`: External project id.
- `preparationId`: Source ADOS preparation id.
- `developmentRequestDraftId`: Source development request draft id.
- `status`: Terminal status: `Completed`, `TimedOut`, `Cancelled`, `Blocked`, or `Failed`.
- `featureBranch`: Trusted feature branch copied from preparation.
- `authoritativeBaseSha`: Trusted base SHA copied from preparation.
- `specPath`: Trusted spec path copied from preparation.
- `repositoryPath`: Primary repository path from local binding.
- `worktreePath`: Local feature worktree path from local binding.
- `validationCommands`: Validation commands copied for audit only.
- `reviewerCommand`: Reviewer command copied for audit only.
- `executionPolicyVersion`: Trusted policy version.
- `trustedLocalExecutionApproved`: True only after explicit local dashboard activation.
- `startedBy`: Local operator label.
- `startedAt`: Attempt timestamp.
- `implementerStarted`: Whether the implementer provider reported a started process.
- `validationStarted`: Always false in this feature.
- `reviewStarted`: Always false in this feature.
- `repositoryMutationStarted`: Always false in this feature.
- `githubMutationStarted`: Always false in this feature.
- `publishStarted`: Always false in this feature.
- `mergeStarted`: Always false in this feature.
- `deployStarted`: Always false in this feature.
- `evidence`: Bounded provider evidence for command display, working directory, timing, and output summaries.
- `rulesVersion`: Bridge rules version.

### Validation Rules

- Preparation must exist and have status `Prepared`.
- Preparation metadata must match the approved branch, authoritative base SHA, spec path, validation commands, reviewer command, and policy version.
- Local binding must include non-empty repository and worktree paths.
- Worktree path must not contain path traversal.
- Existing execution for the same preparation is returned as an already completed result, not invoked again.

## TrustedLocalAdosExecutionResult

Represents the latest bridge result visible in state and dashboard rendering.

### Fields

- `id`: Stable result id derived from project id and preparation id.
- `projectId`: External project id.
- `preparationId`: Source ADOS preparation id when available.
- `executionId`: Execution id when an execution record exists.
- `status`: Terminal bridge status.
- `reasonCodes`: Machine-readable reason codes.
- `started`: Whether a local process was started.
- `duplicateExistingExecution`: True when a repeated action reuses an existing execution.
- No-side-effect booleans: validation, review, repository, GitHub, publish, merge, and deploy indicators remain false.
- `resultAt`: Result timestamp.
- `rulesVersion`: Bridge rules version.

### State Transitions

- Missing or stale context -> `Blocked` result only.
- Provider unavailable or rejected -> `Blocked` result only.
- Provider spawn failed -> `Failed` result only.
- Provider completed or timed out -> execution record plus matching result.
- Repeated action after execution exists -> existing execution plus duplicate result.
