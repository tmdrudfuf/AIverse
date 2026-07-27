# Research: Focused Validation Review Loop

## Existing validation architecture (source of truth, traced from `orchestrateCommand.js`)

- Three stage names call `runValidationCommands`: `validate` (immediately after `implement`), `revalidate` (immediately after `fix`), `final-verification` (immediately after a `review`/`re-review`/`final-review` returns `Approved`, immediately before `human-merge-decision`). All three currently resolve the same single command list via `getValidationCommands(state, options)`.
- `getValidationCommands` precedence today: `options.skipValidation` → `[]`; else `options.validationCommands` (CLI `--validation-command`, repeatable); else `state.validationCommands`; else `DEFAULT_VALIDATION_COMMANDS` (`npm test`, `npx tsc --noEmit`, `npm run build`, `git diff --check`).
- `runValidationCommands` already: parses each command safely (`parseValidationCommand`), rejects unsafe/remote-mutating commands (`assertSafeValidationCommand`) *before* spawning, stamps a monotonically increasing `batchId` (Spec 054 round 9) shared by every command from one call, appends one record per command to `state.validationRuns`, and returns `{ state, records, passed, failedRecord? }`. This exact function is reused unchanged; only the command list and record annotations passed into it change.
- Any validation stage failing today calls `markBlocked` (`orchestration.currentStage = "blocked"`, a `TERMINAL_STAGES` member) and the loop exits permanently for that state file — this is exactly what Spec 055 must change *only* for `final-verification`.
- `nextStageAfterCompleted`: `implement → validate`, `fix → revalidate`, `final-verification → human-merge-decision`. Adding a `final-verification → fix` edge (conditional on the new retry ceiling) requires a new branch inside the `stage === "validate" || stage === "revalidate" || stage === "final-verification"` handling in `runOrchestration`'s loop, not a change to `nextStageAfterCompleted` itself (which only describes the *success* path).
- `fixCycleCount` is only ever incremented in the `Changes Requested` branch of the review-stage handling; it is never touched by validation-stage handling today. This is the seam Spec 055 must not disturb — a new, separate counter is required for full-validation-triggered fixes.

## Reusable git-context data (`reviewCommand.js#collectGitContext`)

Already returns, per call: `headCommit`, `statusPorcelain`, `stagedDiff`, `unstagedDiff`, `hasStagedChanges`, `hasUnstagedChanges`, `mergeBase`, `currentBranch`. No new git plumbing is required to compute a validation/review "target" signature — every input already exists in a value the orchestrator already collects at least once per loop iteration (`gitContext` in `runOrchestration`) or per review call (`runReviewWithoutStateWrite` calls `collectGitContext` itself already).

## Existing tree-modification detection precedent (`getDiffSignature`)

`orchestrateCommand.js#getDiffSignature(gitContext)` already concatenates `statusPorcelain`/`unstagedDiffStat`/`stagedDiff`/`unstagedDiff`/`committedDiffStat`/`committedDiff` into one comparable string, and is already used exactly once today: to detect "did the `fix` stage produce any repository diff at all" (`beforeSignature === afterSignature` → `markBlocked("Fix cycle produced no repository diff")`). Spec 055 reuses this identical helper, symmetrically, around `final-verification`'s command execution: if the signature differs before vs. after running the full command list, the tree was modified by validation itself, and this is treated the same as a validation failure (see spec Clarifications).

## Resume / terminal-stage guarantee (reused from Spec 053/054)

`runOrchestration`'s `while (!TERMINAL_STAGES.has(getCurrentStage(currentState)))` guard means re-invoking `orchestrate` on a state file already at `human-merge-decision` or `blocked` never enters the loop body at all — no stage, validation or otherwise, re-executes. This is the existing mechanism Spec 055 relies on to satisfy "resumed runs do not unnecessarily re-run full validation" (FR-017) without new bookkeeping.

## Why a hash-based target signature, not a new git plugin/dependency

Node's built-in `crypto` module (`createHash("sha256")`) is sufficient to produce a short, deterministic, comparable digest of the already-collected diff text for a dirty tree. No new dependency, no additional git subprocess calls beyond what `collectGitContext` already performs. A clean tree needs no hash at all — `commit` (the `HEAD` SHA) alone is a sufficient, exact identifier.

## Prior art: Spec 053's `roleResolver.js` / Spec 054's `runSummary*.js` module shape

Both prior features introduced small, pure, independently-tested modules rather than growing `orchestrateCommand.js`/`cli.js` further. Spec 055 follows the same shape: `validationPolicy.js` (pure resolution + target computation, no I/O), `validationPlan.js` (read-only "what runs next and why", shared by dry-run and readiness computation), `validationPhase.js` (shared record-field normalization/bucketing, used by both the writer in `orchestrateCommand.js` and the reader in `runSummary.js`).

## Deferred / out of scope

- Automatic changed-file-to-test inference (explicitly warned against in the spec as "fragile test guessing that silently misses required coverage"). Only explicit command configuration is supported.
- A deterministic changed-path-based "high-risk change" policy. Only the explicit `state.validationPolicy.requiresFullValidation` flag is implemented for this initial scope.
- A dedicated `--max-full-validation-fix-cycles` flag. The new `fullValidationFixCycleCount` ceiling reuses the existing `--max-fix-cycles` value to avoid a second, easily-confused CLI flag; this is documented in spec Clarifications and can be split into its own flag later without breaking anything if it turns out to be needed.
- Schema version bump. Every new run-summary field is additive or a refinement of a field already documented as a placeholder.
