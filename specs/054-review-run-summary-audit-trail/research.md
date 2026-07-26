# Research: Review Run Summary and Audit Trail

## Existing state shape (source of truth for the summary builder)

Traced directly from `tools/agent-workflow/orchestrateCommand.js`, `agentWorkflow.js`, `findingLifecycle.js`, `structuredReview.js`, and `roleResolver.js` (no assumptions):

- `state.orchestration`: `currentStage`, `terminalState`, `decision`, `reason`, `nextExpectedAction`, `startedAt`, `updatedAt`, `implementerId`/`implementerIdentity`, `reviewerId`/`reviewerIdentity`, `resolvedImplementerId`/`resolvedReviewerId`/`roleResolutionSource` (Spec 053, pinned for the run's lifetime), `sameRunner`, `maxFixCycles`, `maxQuestionCycles`, `latestReviewDecision`, `latestReviewPath`, `latestReviewOutput`, `latestFindings`, `latestStructuredReviewStatus`/`Path`/`Diagnostics`, `latestFindingLifecycleStatus`/`Diagnostics`/`Path`, `activeBlockingFindings`, `findingHistory` (also mirrored at top level), `latestReviewerQuestion*`, `latestImplementerAnswer*`.
- `state.orchestrationRuns[]` (via `appendRecord`, append-only, durable across resumes): `{ stage, status, path, resultPath }` — one entry per implement/fix/answer-questions attempt.
- `state.reviewRuns[]` (via `runReviewWithoutStateWrite`, append-only): `{ outcome, reviewerId, reviewerIdentity, implementerId, sameRunner, recordedAt, promptPath, executionPath, resultPath, structuredReviewStatus, structuredReviewDecision, structuredReviewDiagnostics, structuredReviewPath? }` — **no existing field distinguishes `review`/`re-review`/`final-review`**; this feature adds one (`stage`).
- `state.validationRuns[]` (via `appendRecord` inside `runValidationCommands`, append-only): full command record including `command`, `commandExecutable`, `args`, timing, `exitCode`, `signal`, `timedOut`, `interrupted`, `errorMessage`, `status` (`passed`/`failed`/`timed-out`/`interrupted`), `path`.
- `state.findingHistory[]` (via `findingLifecycle.js`, replace-in-place per review, not append-only — each valid lifecycle result is the full current history): `{ findingId, kind ("blocking"/"non_blocking"), severity, summary, recommendation, firstSeenReviewSequence, lastSeenReviewSequence, currentStatus ("new"/"still_open"/"resolved"), resolvedReviewSequence?, sourceReviewArtifactPath, latestReviewArtifactPath, latestStructuredReviewPath, finding }`.
- `state.questionCycle`, `state.fixCycleCount`: simple counters, already exactly what Spec 054 needs for `questionCycles`/`fixCycles`.
- `state.latestResolvedRoles`/`state.latestRoleResolutionSource` (Spec 053, top-level, updated every `orchestrate` invocation that resolves roles): fallback role source when `orchestration.resolvedImplementerId` is absent (e.g. non-orchestration-scoped legacy data).

## Run identity and "resume" boundary (reused from Spec 053 data-model.md)

A run is in progress (pinned, resumable) when `orchestration.startedAt` is set and the current stage is non-terminal; a run is "new" when `startedAt` is absent. `orchestration.startedAt` is preserved across resumes (`getOrchestration(state).startedAt || new Date().toISOString()`), making it a stable, already-existing anchor for a `runId` (`run-<startedAt>`), with no new bookkeeping required.

## Why `runOrchestration`'s loop is a safe single integration point

`runOrchestration` is one synchronous (`async`, but not resumable mid-await from the outside) function call: it loops `while (!TERMINAL_STAGES.has(getCurrentStage(currentState)))`, and every branch inside the loop either `continue`s toward the next stage or `break`s after already calling `writeState`/`persistStage`. There is no code path where the function returns without the loop having exited. Sub-agent/validation timeouts and interruptions are resolved *inside* the awaited `adapter.run(...)` promise (the child process is killed by the timeout timer; the parent keeps running and receives a normal resolved promise with `timedOut`/`interrupted` set), so they are handled entirely within one iteration of the loop, not by the parent process itself dying. The only case genuinely outside this model is the parent Node process being killed at the OS level (`taskkill`, crash, Ctrl+C) — in that case no code runs to write a summary for that instant, but the last `persistStage`/`markBlocked` + `writeState` call before the kill already left a valid, readable state on disk, which the read-only `summary` command (or the next resumed `orchestrate` invocation) can summarize correctly.

## Prior art: Spec 053's `roleResolver.js` as the precedent for this module shape

Spec 053 introduced one small, pure, independently-tested module (`roleResolver.js`) rather than scattering resolution logic across call sites, and exported a `validateAgentForRole` helper later reused by a different call site (`reviewCommand.js`) during its own fix cycle. This feature follows the same shape: `runSummarySchema.js` (pure enum/version normalization), `runSummary.js` (pure `buildRunSummary` + one filesystem-touching `refreshRunSummary`), `runSummaryRenderer.js` (pure Markdown rendering), `summaryCommand.js` (read-only CLI presentation reusing `buildRunSummary` directly).

## Naming collision avoided

`tools/agent-workflow/cli.js` already exports a function named `formatRunSummary` (used by the *unrelated* `run --until-blocked` command's step-by-step printout, from Spec 044/047). This feature's CLI-facing formatting functions are named distinctly (`formatOrchestrationSummaryPointer`, `formatSummaryCommandOutput`, etc.) to avoid any confusion with that existing, unrelated export.

## Atomic write precedent

`agentWorkflow.js`'s `writeState` already writes atomically via a temp file (`${statePath}.${pid}.${Date.now()}.tmp`) followed by `fs.renameSync`. `refreshRunSummary` reuses the identical pattern for both `run-summary.json` and `run-summary.md`, so a crash mid-write cannot leave a partially-written summary artifact.

## Deferred / out of scope

- Cross-run or cross-feature dashboards (this feature is one summary per feature's run directory, not a project-wide index).
- Any mechanism for detecting a real GitHub PR's existence from the state file (no such evidence exists in this workflow today, so PR-specific human-gate states are defined but never populated).
- Migrating or rewriting old run directories/state files to add missing Spec 054 fields.
- Per-run subdirectories (the codebase has no such concept anywhere; introducing one here would be an unrelated architectural change).
