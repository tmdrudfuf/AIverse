# Data Model: Agent Workflow Automated Fix Loop

## Workflow State Extensions

Existing state remains valid. The orchestration command may add:

- `orchestration`: latest orchestration summary.
- `orchestrationRuns`: historical stage records.
- `validationRuns`: validation command records.
- `latestReviewDecision`: last Reviewer outcome.
- `latestFindings`: actionable finding records plus raw output path.
- `fixCycleCount`: number of fix cycles attempted.
- `maxFixCycles`: configured fix-cycle limit.
- `terminalState`: `human-merge-decision`, `blocked`, or empty.
- `nextExpectedAction`: human-readable next step.

## Orchestration Run

Fields:

- `stage`: `implement`, `validate`, `review`, `fix`, `revalidate`, `re-review`, `final-verification`, `human-merge-decision`, or `blocked`.
- `status`: `completed`, `failed`, `blocked`, `timed-out`, `execution-failed`, or `skipped`.
- `startedAt`, `completedAt`: ISO timestamps.
- `artifactPaths`: prompt, execution, result, validation, or review artifact paths.
- `reason`: conservative stop reason when not successful.

## Validation Run

Fields:

- `stage`: `validate`, `revalidate`, or `final-verification`.
- `command`: command text.
- `startedAt`, `completedAt`, `durationMs`.
- `exitCode`, `signal`, `timedOut`, `interrupted`, `errorMessage`.
- `stdout`, `stderr`.
- `status`: `passed` or `failed`.
- `path`: local artifact path.

## Review Finding

Fields are optional unless present in Reviewer output:

- `filePath`
- `location`
- `problem`
- `impact`
- `recommendation`
- `rawText`

Validation rules:

- Do not synthesize missing fields.
- At least one actionable field (`filePath`, `location`, `problem`, or `recommendation`) plus raw text is required to start a fix.
- Raw Reviewer output remains available even when extraction is partial.

## Fix Cycle

Fields:

- `cycle`: 1-based cycle number.
- `reviewPath`: Reviewer raw output path.
- `findingCount`: actionable findings sent to Implementer.
- `fixExecutionPath`
- `validationPaths`
- `reReviewPath`
- `status`

Validation rules:

- `cycle` must not exceed `maxFixCycles`.
- A no-change fix blocks the loop before re-review.
