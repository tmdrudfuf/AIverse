# Research: Runtime Role Selection

## Decision: Roster-based auto-Reviewer derivation instead of inferring from `agentRunners` keys

**Rationale**: `agentRunners` already contains role-slot aliases (`implementer`, `reviewer`) alongside physical-agent aliases (`codex`, `claude`) and, in some existing states, one-off custom overrides (e.g. `codex-reviewer`) that exist only to fill a single stage. Inferring "the roster of agents eligible for auto-Reviewer selection" from `Object.keys(agentRunners)` would inflate the roster with slot aliases and one-off overrides never meant to represent a distinct physical agent, breaking the "exactly two eligible agents" default case for existing states that already customize one role. A small explicit roster (default `["codex", "claude"]`, overridable via optional `state.roleRoster`) keeps the common case exact and deterministic while still letting a maintainer opt into more agents later.

**Alternatives considered**:
- Infer roster from `agentRunners` keys — rejected: not deterministic against existing per-stage override conventions.
- Require an explicit `--reviewer` flag whenever `--implementer` is used — rejected: spec explicitly requires no `--reviewer` requirement for the two-agent case.

## Decision: Resume role pinning is scoped to `orchestrate`, keyed on `orchestration.startedAt`

**Rationale**: `orchestrate` is the only command with a genuine multi-invocation "run" concept (a state file's `orchestration.currentStage` can be non-terminal across separate CLI process invocations, e.g. after an interruption). `run-review` and `detect-agent` are single-invocation, stateless-across-calls commands with no persisted "in-progress run" to resume. Keying pinning on whether `orchestration.startedAt` is already present in the incoming state cleanly distinguishes "continuing an existing run" (reuse pinned roles, reject conflicting `--implementer`) from "starting a new run" (resolve fresh from CLI/state/default), without adding a separate run-ID concept. Existing orchestration tests never call `runOrchestration` twice against evolving state in one test, so enabling this pinning is fully backward compatible — it only changes behavior across genuinely separate invocations.

**Alternatives considered**:
- Pin roles on every call regardless of prior state — rejected: would require inventing a new "run identity" field not otherwise needed for the terminal/non-terminal state machine that already exists.
- Only pin when `--implementer` was used to start the run — rejected: the spec's resume section also calls out "modified state role preferences" as an invalid recalculation source, which can happen even for state/default-sourced runs; general pinning covers both cases for free.

## Decision: Existing same-runner warning-and-continue behavior is preserved outside the CLI-override path

**Rationale**: Spec 048/README already documents that a same-runner Implementer/Reviewer configuration prints `SAME_RUNNER_WARNING` and still runs, for the state/default resolution paths. Spec 053's "never select the same agent for both roles automatically" requirement is specific to the *new* roster-based auto-derivation triggered by `--implementer`: by construction, deriving "the other roster member" cannot select the same id as the requested Implementer unless the roster itself is degenerate (one entry), which is handled as a distinct "no Reviewer candidate" rejection. Hard-rejecting same-runner outside the CLI-override path would be a breaking behavior change explicitly excluded by the "Compatibility" section of the spec.

## Decision: `--implementer=value` (equals form) is not supported

**Rationale**: No existing flag in `tools/agent-workflow/cli.js` supports the `--flag=value` form; `readFlag`/`hasFlag` only support space-separated `--flag value`. The spec explicitly says to only add equals-form support if existing parsing already supports it consistently. It does not, so `--implementer=value` is left unsupported for consistency, and this is documented in the README.

## Decision: Repeated `--implementer` handling

**Rationale**: The generic `readFlag` helper silently takes the first occurrence of any flag today. For every other flag, that silent behavior is low-risk (e.g. `--stage`, `--agent` for a single ad hoc override). For `--implementer`, silently picking either value on a conflict could route real, full-access agent CLI spawns to the wrong tool, which is a materially different risk. A dedicated strict-value reader is used only for `--implementer`: identical repeated values normalize to one value; conflicting repeated values are rejected before spawn; a flag with no value (end of argv or immediately followed by another `--flag`) is rejected as a missing value.
