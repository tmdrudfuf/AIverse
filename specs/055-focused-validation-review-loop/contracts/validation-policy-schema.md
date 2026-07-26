# Contract: Validation Policy Resolution & Phase Selection

## `resolveValidationPolicy({ state, options })` → `{ strategy, focusedCommands, fullCommands, focusedCommandsConfigured, requiresFullValidation }`

**Precedence (highest first)**:

- `strategy`: `options.validationStrategy` (`--validation-strategy`) → `state.validationPolicy.strategy` → `"full-every-cycle"`. An unrecognized value falls back to `"full-every-cycle"` (never throws, never silently picks the other strategy).
- `fullCommands`: `options.fullValidationCommands` (`--full-validation-command`, repeatable) → `options.validationCommands` (legacy `--validation-command`, repeatable) → `state.validationPolicy.fullCommands` → `state.validationCommands` (legacy) → `DEFAULT_VALIDATION_COMMANDS`.
- `focusedCommands`: `options.focusedValidationCommands` (`--focused-validation-command`, repeatable) → `state.validationPolicy.focusedCommands` → `undefined` (absent; triggers the documented fallback-to-full at phase-selection time).
- `requiresFullValidation`: `Boolean(state.validationPolicy.requiresFullValidation)`.
- `options.skipValidation` is orthogonal to this resolution (handled by the existing `getValidationCommands`-equivalent skip check, unchanged: skip means zero commands run for that occurrence regardless of resolved policy).

**Invariants**:

1. Never returns an unrecognized `strategy` value.
2. Never returns an empty `fullCommands` array (always at least `DEFAULT_VALIDATION_COMMANDS`).
3. Never mutates `state` or writes anything.

## `resolvePhaseForStage({ policy, stage, forceFullValidation })` → `"focused" | "full"`

**Rules, in order**:

1. `stage === "final-verification"` → always `"full"`.
2. `forceFullValidation` (`--force-full-validation`, this invocation only) → `"full"`.
3. `policy.requiresFullValidation` → `"full"`.
4. `policy.strategy === "full-every-cycle"` → `"full"`.
5. `policy.strategy === "focused-final-full"` and `policy.focusedCommandsConfigured` → `"focused"`.
6. `policy.strategy === "focused-final-full"` and **not** `policy.focusedCommandsConfigured` → `"full"` (documented fallback; never `"skip"`).

**Invariant**: For `stage === "final-verification"`, the result is always `"full"` regardless of any other input — this is the one rule nothing may override, since it is the sole gate for `humanGate.ready`.

## `commandsForPhase(policy, phase)` → `string[]`

Returns `policy.focusedCommands` for `"focused"` (only ever called when `resolvePhaseForStage` already returned `"focused"`, i.e. commands are known configured) or `policy.fullCommands` for `"full"`. Never returns an empty array (both lists are guaranteed non-empty by `resolveValidationPolicy`'s own fallback to `DEFAULT_VALIDATION_COMMANDS`, unless validation is explicitly skipped, which bypasses this function entirely).

## `computeValidationTarget(gitContext)` → `{ commit, dirty, dirtyHash }`

- `commit = gitContext.headCommit || null`.
- `dirty = Boolean(gitContext.hasStagedChanges || gitContext.hasUnstagedChanges)`.
- `dirtyHash = dirty ? sha256(statusPorcelain + stagedDiff + unstagedDiff).slice(0, 12) : null`.
- Pure function of its input; no I/O, no git subprocess call of its own (the caller already collected `gitContext`).

## `targetsMatch(a, b)` → `boolean`

`true` iff both are non-null objects, `a.commit === b.commit`, `a.dirty === b.dirty`, and (`!a.dirty || a.dirtyHash === b.dirtyHash`). `false` (never throws) if either is `null`/`undefined` or any field mismatches.

## `isFinalValidationSatisfied(state)` → `{ satisfied, reason }`

Inspects `state.validationRuns`/`state.reviewRuns` for the latest `phase: "full"` batch and the latest Approved review; `satisfied` is `true` only when **all** of the following hold: the full batch's last command status is `"passed"`, the latest review's outcome is `"Approved"`, **both** records carry a `target`, and `targetsMatch(...)` is `true` for them. A record with no `target` at all (legacy/pre-Spec-055 data, or state built without target tracking) makes `satisfied` `false` with `reason: "target-evidence-missing"` — exact-match evidence is a requirement this feature introduces, not an optional enhancement, so absent evidence is never read as a free pass (per spec.md FR-010: readiness "MUST be false whenever this comparison fails, is inconclusive, or either target is missing"). A positive mismatch (both present, values differ) is `reason: "target-mismatch"`. Used identically by `runSummary.js`'s `humanGate`/`finalReadinessSatisfied` computation and by any future readiness check, so the two can never disagree (Architecture Decision: single source of truth for this question).

## Unsafe-command rejection (unchanged contract, reaffirmed)

`assertSafeValidationCommand` (existing, `orchestrateCommand.js`) is invoked identically for every command in both `focusedCommands` and `fullCommands`, before any subprocess spawns, regardless of which phase selected them. This contract adds no new bypass path.
