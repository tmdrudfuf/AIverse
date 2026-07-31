# Research: Claude Implementer Runtime Foundation

## Existing pipeline shapes (Execution Plan through Runtime Start)

All five prior stages (`execution-plans/`, `execution-readiness/`, `human-execution-approvals/`, `runtime-preflight/`, `runtime-start/`) live under `src/features/city-view/scene/office/`, each with `Types.ts`/`Service.ts`/`View.ts` (+ tests), `runtime-preflight/` additionally has a `Provider.ts`. Every stage is fully synchronous — no `await` anywhere in the chain. Concurrency safety comes entirely from full revalidation on every attempt plus deterministic, project-scoped IDs, not from a request-version counter (that pattern exists elsewhere in the controller, e.g. `issueSyncRequestVersion`, but only for the genuinely asynchronous repository/issue-sync flows).

`RuntimeStart` (074) types `agentStarted`/`implementerStarted`/`reviewerStarted`/`validationStarted`/`repositoryMutationStarted`/`githubMutationStarted` as the literal `false` — a compile-time guarantee that Runtime Start can never claim any of them happened. `implementer`/`reviewer` fields are plain strings, always the literal `"Implementer"`/`"Reviewer"` at every one of the five controller call sites that construct a Plan/Approval/Preflight/Runtime Start record.

## Finding 1: the existing agent-name resolver hardcodes the default role mapping

`RuntimePreflightProvider.normalizeAgentCommand(agentLabel)`:

```ts
function normalizeAgentCommand(agentLabel: string) {
  const normalized = agentLabel.trim().toLowerCase();
  if (normalized.includes("codex") || normalized === "implementer") return "codex";
  if (normalized.includes("claude") || normalized === "reviewer") return "claude";
  return agentLabel.trim();
}
```

Since every record's `implementerAgent`/`implementer` field is always the literal `"Implementer"`, this function always resolves it to `"codex"` — the repository's default mapping (Codex=Implementer, Claude=Reviewer, matching `AGENTS.md`). This is exactly the "repository default agent-role mapping" the Spec 075 prompt says must not be relied on. Reusing this function, or writing a parallel resolver for the same label that returns `"claude"` instead, would make the approved-role check pass unconditionally on every input this pipeline can currently produce (see plan.md, Architecture Decision 3, for the resolution: the approved binding travels as explicit request data instead).

`isSafeCommandLine` (also in `RuntimePreflightProvider.ts`) is exported and reused as-is; `normalizeAgentCommand` and `isSafeMutationScope` are not exported and are not needed by this feature (this feature carries its own approved-agent constants rather than normalizing a label).

## Finding 2: the office scene graph is bundled into the browser client — empirically confirmed

`CitySceneCanvas.tsx` (`"use client"`) statically imports `createCityScene`, which statically imports `createCompanyOfficeScene` from `./office/CompanyOfficeScene` — the entire office portal module graph is part of the Next.js client bundle.

Experiment 1 (build failure): a throwaway file with a static top-level `import { spawnSync } from "node:child_process"`, transitively imported into that graph, produced:

```text
Error: Turbopack build failed with 1 errors:
./src/features/city-view/CitySceneCanvas.tsx
...the chunking context (unknown) does not support external modules (request: node:child_process)
```

Experiment 2 (build success): the same import rewritten behind a runtime guard —

```ts
if (typeof window !== "undefined") return null;
const { spawnSync } = await import("node:child_process");
```

— transitively imported into the same graph, built successfully (`npm run build` passed, static page generation succeeded).

Experiment 3 (Node/Vitest resolution): `vitest.config.ts` sets no `environment` option, so Vitest defaults to `"node"` (no global `window`). A throwaway test calling the exact guarded function above confirmed the dynamic import resolves and `spawnSync` executes correctly under Vitest.

All three throwaway probe files/tests were deleted after the experiments; none ship in the final diff.

**Conclusion**: `ClaudeImplementerRuntimeProvider` can be one real class, safely constructed directly in the controller (mirroring `GitHubIssueSyncProvider`), using this guard internally. It performs a real invocation only in a genuinely Node context (this repo's Vitest suite, or the documented manual smoke-test script); in an actual browser session it reports `Blocked` immediately.

## Finding 3: `spawnSync` timeout/failure semantics on this platform — empirically confirmed

A throwaway Node script (`spawnsync_timeout_test.js`) ran five cases directly against `child_process.spawnSync` on this Windows machine:

| Case | `status` | `signal` | `error` |
|---|---|---|---|
| Timeout kill (1s timeout, 30s child) | `null` | `"SIGTERM"` | `code: "ETIMEDOUT"` |
| Normal success exit | `0` | `null` | `undefined` |
| Non-zero exit (`process.exit(7)`) | `7` | `null` | `undefined` |
| Spawn failure (nonexistent executable) | `null` | `null` | `code: "ENOENT"` |

`spawnSync` blocks until the child is fully reaped — by the time it returns, the process is already gone; there is no separate cleanup step to perform, and no orphan-process risk, because the call is synchronous by construction. This gives a fully deterministic mapping with no ambiguity between timeout, spawn failure, and non-zero exit, which is why Decision 1 (plan.md) settles on a blocking-spawn design rather than an async child-process API requiring explicit SIGTERM/SIGKILL escalation.

## Existing Claude/Codex CLI invocation convention (`tools/agent-workflow/agentRunner.js`)

```js
const CLAUDE_FULL_ACCESS_ARGS = ["--dangerously-skip-permissions", "-p", "{{prompt}}"];
// claude: { command: "claude", args: CLAUDE_FULL_ACCESS_ARGS, inputMode: "argument" }
```

This is dev-tooling (used by `tools/agent-workflow/cli.js run-review` etc. to run this repository's own Implementer/Reviewer loop) — a separate concern from the in-product `ClaudeImplementerRuntimeProvider`, which is not permitted to import from `tools/agent-workflow` (that is dev tooling, not a product dependency). This spec's approved Claude command configuration matches this convention's shape (same command, same input mode, same placeholder) as a deliberate choice documented in plan.md, per the instruction not to silently replace `claude -p "{{prompt}}"` with something else.

## Dashboard row-fit mechanism (`OfficeProjectPortalView.ts`)

`fitProjectDashboardLowerRows` removes the row with the highest `dropPriority` first (ties broken by later array index) until the remaining set's computed height fits the panel. Current pipeline-stage priorities: `[ACTIVE WORK SESSION]` 5, `[HUMAN EXECUTION APPROVAL]` 9, `[RUNTIME PREFLIGHT]` 11, `[EXECUTION PLAN]` 12, `[RUNTIME START]` 13, `[EXECUTION READINESS]` 14. `[IMPLEMENTER RUNTIME]` uses `15` — the next value up, making it the single most disposable pipeline-stage row.
