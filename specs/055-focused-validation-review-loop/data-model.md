# Data Model: Focused Validation Review Loop

## Validation Policy (`state.validationPolicy`, additive, optional)

```json
{
  "validationPolicy": {
    "strategy": "focused-final-full",
    "focusedCommands": ["node --test tools/agent-workflow/validationPolicy.test.ts"],
    "fullCommands": ["npm test", "npx tsc --noEmit", "npm run build", "git diff --check"],
    "requiresFullValidation": false
  }
}
```

- `strategy`: `"full-every-cycle"` (default when the object or field is absent) or `"focused-final-full"`.
- `focusedCommands`/`fullCommands`: optional; CLI flags (`--focused-validation-command`, `--full-validation-command`, repeatable) take precedence over these when supplied for a given invocation, and are never written back into state (matching the existing `--implementer`/`--validation-command` precedent: CLI overrides for one execution, never a silent state rewrite).
- `requiresFullValidation`: optional, explicit high-risk-change escape hatch (spec Clarifications); when `true`, every `validate`/`revalidate` occurrence in this run uses the full command list regardless of `strategy`.
- Legacy `state.validationCommands` (pre-Spec-055) remains a valid source for `fullCommands` when `validationPolicy.fullCommands` is absent (see Backward Compatibility).

## Validation Phase (`"focused"` | `"full"`)

Resolved per stage occurrence, not stored as a standalone entity — it is stamped onto each `validationRuns` record (see below) and mirrors this fixed mapping:

| Stage | `full-every-cycle` | `focused-final-full` |
|---|---|---|
| `validate` | full | focused (or full if unconfigured/`requiresFullValidation`) |
| `revalidate` | full | focused (or full if unconfigured/`requiresFullValidation`) |
| `final-verification` | full | full |

## Validation Target (`{ commit, dirty, dirtyHash }`)

```json
{ "commit": "bcba841e6ed715966066995c290f37ceab2410c8", "dirty": false, "dirtyHash": null }
```

or, for an uncommitted tree:

```json
{ "commit": "bcba841e6ed715966066995c290f37ceab2410c8", "dirty": true, "dirtyHash": "a1b2c3d4e5f6" }
```

- `commit`: current `HEAD` SHA (`collectGitContext().headCommit`), never fabricated.
- `dirty`: `true` when `hasStagedChanges || hasUnstagedChanges`.
- `dirtyHash`: present only when `dirty` is `true`; `sha256` (first 12 hex chars) of `statusPorcelain + stagedDiff + unstagedDiff`, computed by `validationPolicy.js#computeValidationTarget`.
- Two targets match exactly iff `commit`, `dirty`, and (when dirty) `dirtyHash` are all equal.

## Validation Run Record (`state.validationRuns[]`, additive fields on the existing Spec 045/054 shape)

Existing fields unchanged (`stage`, `batchId`, `command`, `status`, `exitCode`, `durationMs`, `path`, ...). New, additive:

```json
{
  "phase": "focused",
  "triggerReason": "reviewer-fix",
  "target": { "commit": "...", "dirty": false, "dirtyHash": null }
}
```

- `phase`: `"focused"` or `"full"`. A record with no `phase` field (pre-Spec-055) is interpreted as `"full"` (see Backward Compatibility).
- `triggerReason`: one of `initial-implementation` (first `validate`), `reviewer-fix` (`revalidate` after a Reviewer-Changes-Requested `fix`), `full-validation-candidate` (`final-verification`, always — this occurrence exists because a valid Approval candidate exists), `full-validation-retry` (`revalidate` after a `final-verification`-triggered `fix`), `manual-request` (`--force-full-validation` elevated this occurrence to full regardless of its normal reason), `reviewer-question-answer-change` (reserved; not reachable today — `executeAnswerQuestionsStage` hard-blocks if an answer pass modifies any file, so no code-changed-by-Q&A case exists to trigger revalidation), `resume-revalidation` (reserved; not reachable in the current single-loop-invocation model, since a resumed run at a terminal stage never re-enters the loop — see research.md).
- `target`: see above; absent on legacy records (never fabricated for old data).

## Review Run Record (`state.reviewRuns[]`, additive field)

```json
{ "target": { "commit": "...", "dirty": false, "dirtyHash": null } }
```

Same shape and rules as the validation target; recorded once per `review`/`re-review`/`final-review` attempt, letting the summary compare the Reviewer's exact reviewed target against the `final-verification` target for exact-match readiness.

## Full Validation Fix Cycle Count (`orchestration.fullValidationFixCycleCount`, additive)

An integer counter, separate from `orchestration.fixCycleCount`/`state.fixCycleCount` (Reviewer-requested fixes). Incremented only when `final-verification` fails or modifies the tree and the run routes to `fix` instead of hard-blocking. Capped by the same resolved `maxFixCycles` value; exceeding it hard-blocks with a distinct reason (`"Maximum full-validation fix cycles reached"`).

## Run Summary Integration (`runSummary.js`, additive to the existing Spec 054 model, `schemaVersion` unchanged at `1`)

```json
{
  "validation": {
    "strategy": "focused-final-full",
    "status": "passed",
    "commands": [{ "...": "...", "phase": "focused" }],
    "focused": { "status": "passed", "attempts": 3 },
    "full": { "status": "passed", "attempts": 1 },
    "finalReadinessSatisfied": true
  },
  "commits": {
    "implementationCommit": null,
    "reviewedTarget": { "commit": "...", "dirty": false, "dirtyHash": null },
    "fullValidationTarget": { "commit": "...", "dirty": false, "dirtyHash": null },
    "currentBranchHead": "...",
    "exactCommitMatch": true
  }
}
```

- `validation.status` (existing field, redefined): mirrors the **full** phase's status, never the focused phase's — see plan.md Architecture Decision 5. For `full-every-cycle`, every record is phase `"full"`, so this is unchanged from Spec 054 behavior.
- `validation.commands[]` (existing field): unchanged shape, each entry gains an additive `phase`.
- `validation.focused`/`validation.full` (new): `{ status, attempts }`, computed by grouping `validationRuns` by `phase` (legacy records bucket as `full`) and by distinct `batchId` occurrence for `attempts`.
- `validation.finalReadinessSatisfied` (new): `true` only when the full phase has passed **and** its target exactly matches the latest Approved review's target.
- `commits.exactCommitMatch` (existing field, refined): `true`/`false` once both `reviewedTarget` and `fullValidationTarget` exist; `"unknown"` when either is absent, exactly Spec 054's original placeholder behavior for a run that hasn't reached that point yet.

## Backward Compatibility

- A state file with no `validationPolicy` resolves to `strategy: "full-every-cycle"` with commands resolved exactly as pre-Spec-055 `getValidationCommands` did (`state.validationCommands` / `DEFAULT_VALIDATION_COMMANDS`), reproducing identical stage-by-stage command execution.
- A `validationRuns`/`reviewRuns` record with no `phase`/`target` field is interpreted as `phase: "full"` / target absent (`"unknown"` in comparisons), never crashing, never fabricating evidence.
- `schemaVersion` remains `1`; no existing run-summary field is renamed or removed.
