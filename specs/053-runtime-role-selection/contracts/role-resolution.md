# Contract: Role Resolution

## `resolveEffectiveRoles({ state, requestedImplementerId, existingRunRoles, agents })`

Pure function. No filesystem or process access.

- `state`: workflow state (used for `state.stageAgents`, `state.agentRunners`, `state.roleRoster`).
- `requestedImplementerId`: the CLI `--implementer` value, or `undefined`.
- `existingRunRoles`: `{ implementer, reviewer, source }` pinned from an in-progress run, or `undefined` for a new run.
- `agents`: optional injected agent-runner map override, for tests.

### Required Behavior

1. **Resume check first.** If `existingRunRoles` is provided:
   - If `requestedImplementerId` is provided and differs from `existingRunRoles.implementer`, return `{ ok: false, source: "resume-conflict", diagnostics: [...] }` naming the existing run roles, the requested override, and stating the run's roles are already fixed.
   - Otherwise return `{ ok: true, roles: { ...existingRunRoles }, source: existingRunRoles.source }` — the pinned roles, unchanged.
2. **CLI override.** If no `existingRunRoles` and `requestedImplementerId` is provided:
   - Reject if the requested agent does not exist in the merged `agentRunners` map (default diagnostics list the available roster).
   - Reject if the requested agent is `enabled: false`.
   - Reject if the requested agent is not part of the configured role roster (default `["codex", "claude"]`).
   - Compute `others = roster - { requestedImplementerId }`.
     - Exactly one candidate: use it as Reviewer.
     - Zero candidates: reject ("no distinct Reviewer candidate").
     - More than one candidate: if the state-configured Reviewer (`stageAgents.review`) is distinct from the requested Implementer and is one of `others`, preserve it; otherwise reject with an ambiguity diagnostic.
   - Reject if the resolved Reviewer does not exist, is disabled, or its runner is unsafe/remote-mutating (Spec 045 checks).
   - Reject if the resolved Reviewer equals the requested Implementer (defensive; should not occur given the roster subtraction above).
   - On success, return `{ ok: true, roles: { implementer, reviewer }, source: "cli-override" }`.
3. **State/default passthrough.** If neither of the above applies, resolve `implementer = state.stageAgents?.implement || "implementer"`, `reviewer = state.stageAgents?.review || "reviewer"`, `source = "state"` if either was explicitly configured, else `"default"`. Existence/safety validation for this path is unchanged from existing behavior (handled by the caller's existing `resolveAgentConfig`/`assertSafeCommand` calls) — this path never introduces a new rejection reason.

### Non-Requirements

- Does not spawn a process.
- Does not read or write files.
- Does not mutate `state`.

## `describeEffectiveRoles(state, roles, source)`

Maps resolved agent IDs to `{ agentId, displayName }` pairs using the existing `resolveAgentConfig(state, agentId).identity` string, for CLI display and state persistence. Throws only if an id in `roles` is not configured (should not happen for an already-validated `ok: true` result).

## Integration Points

- `orchestrateCommand.js`: `previewOrchestration`/`runOrchestration` call `resolveEffectiveRoles` once per invocation with `existingRunRoles` derived from `state.orchestration` when the run is non-terminal and already pinned. On success, the resolved ids are threaded through every stage call for that invocation (implement/fix, answer-questions, review/re-review/final-review) instead of being re-derived per stage.
- `reviewCommand.js`: `previewIndependentReview`/`runIndependentReview` accept `options.implementerAgentId`; when supplied and `options.agentId` (existing Reviewer override) is not, the Reviewer is auto-derived via `resolveEffectiveRoles`. No run-scoped pinning (each invocation is independent).
- `agentWorkflowRun.js`/`cli.js run`: `--implementer` is mapped to whichever of `implementer`/`reviewer` the current stage's role is (via the existing `DEFAULT_STAGE_AGENTS` stage-to-role mapping), then passed as the existing `--agent` override for that single stage. No run-scoped pinning.
- `cli.js detect-agent`: `--implementer <id>` probes both the requested Implementer and its auto-derived Reviewer's CLI installation in one call; `--agent <id>` continues to probe exactly one agent id, unchanged.
