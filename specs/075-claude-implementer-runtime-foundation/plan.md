# Implementation Plan: Claude Implementer Runtime Foundation

**Branch**: `codex/075-claude-implementer-runtime-foundation` | **Date**: 2026-07-30 | **Spec**: [spec.md](./spec.md)

## Summary

Add a focused `implementer-runtime` domain module that, after a full revalidation of Execution Plan through Runtime Start plus an explicit approved-role-binding check, safety-validates and invokes the configured Claude CLI command through a provider-neutral boundary, producing exactly one bounded, immutable terminal result. The action requires a distinct explicit human input, never Runtime Start's mere existence.

## Technical Context

**Language/Version**: TypeScript in the existing Next.js/Phaser application.

**Primary Dependencies**: Existing office portal services, state, and Vitest test setup. `node:child_process` (`spawnSync`), imported only behind a runtime guard (see Architecture Decision 3).

**Storage**: In-memory per-project portal state and immutable local collections, matching every prior pipeline stage.

**Testing**: Vitest focused tests, full `npm test`, TypeScript, build, and diff checks.

**Target Platform**: Existing browser/game runtime for the controller/view/registry layer; Node (Vitest, or a documented manual smoke script) for the real Claude CLI subprocess invocation.

**Performance Goals**: The Implementer Runtime attempt is a single bounded, timeout-capped blocking operation; no polling, no background retries.

**Constraints**: No Codex invocation, no dedicated Validation-stage execution, no repository/GitHub mutation, no commit/push/PR of any kind from product code.

**Scale/Scope**: One active Implementer Runtime attempt per Runtime Start per project at a time.

## Constitution Check

- Spec First: Passed. `spec.md` defines user value, acceptance scenarios, boundaries, and measurable outcomes.
- Plan Before Code: Passed. This plan documents three empirically-verified architecture decisions before implementation.
- Tasks Gate Implementation: Passed after `tasks.md` exists.
- Preserve Application Stability: Passed by extending existing office portal modules only; Execution Plan/Readiness/Approval/Preflight/Runtime Start services are reused unmodified.
- Validation Required: Passed by focused and full validation plan, including the empirical build/runtime experiments recorded below.

## Project Structure

### Documentation

```text
specs/075-claude-implementer-runtime-foundation/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── implementer-runtime.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code

```text
src/features/city-view/scene/office/
├── implementer-runtime/
│   ├── ImplementerRuntimeTypes.ts
│   ├── ImplementerRuntimeProvider.ts
│   ├── ClaudeImplementerRuntimeProvider.ts
│   ├── ImplementerRuntimeService.ts
│   ├── ImplementerRuntimeView.ts
│   └── *.test.ts
├── runtime-start/            (reused, unmodified)
├── runtime-preflight/        (reused, unmodified — isSafeCommandLine imported from here)
├── OfficeProjectPortalController.ts
├── OfficeProjectPortalRegistry.ts
├── OfficeProjectPortalTypes.ts
└── OfficeProjectPortalView.ts
```

## Architecture Decisions

Three questions were resolved experimentally (not assumed) before writing implementation code, because getting any of them wrong would invalidate a large share of the design and tests.

### Decision 1 — Synchronous lifecycle, no request-version counter

Every stage from Execution Plan through Runtime Start is fully synchronous (no `await` anywhere in that chain); concurrency safety comes from full revalidation on every attempt, not from a request-version guard. The spec's own fallback instruction — "if the existing synchronous architecture cannot truthfully expose live `Starting`/`Running`, use the smallest truthful model" — is taken literally: the lifecycle is `Completed | TimedOut | Cancelled | Blocked | Failed`, with no `Starting`/`Running` member. `Cancelled` is modeled for type completeness but has no reachable product-code trigger in this spec (no coherent cancellation path exists for a blocking spawn); this is stated explicitly rather than built around a fabricated cancel button.

Because the underlying invocation is a single blocking call (see Decision 2), there is no genuine in-flight window in which a second, independent request could observe a stale intermediate value — the entire operation, from the caller's perspective, either hasn't started, or is already finished. Duplicate-start protection therefore uses a simple synchronous check-then-mark against the project's Implementer Runtime collection (an active/unresolved entry blocks a second attempt), not a monotonic request-version counter. Adding a request-version counter here would be speculative machinery for a race window that cannot occur.

### Decision 2 — A single real Claude provider, safe in both the browser and Node, verified experimentally

`OfficeProjectPortalController`/`View`/`Registry` are transitively imported by `src/features/city-view/CitySceneCanvas.tsx` (a `"use client"` component, imported statically by `CityView.tsx`/`app/page.tsx`), so anything they import is bundled into the browser client build. `node:child_process` is a Node-only built-in.

Experiment performed in this worktree before writing `ClaudeImplementerRuntimeProvider`:

1. A throwaway file with a **static top-level** `import { spawnSync } from "node:child_process"`, transitively imported into `createCityScene.ts` → `npm run build` **failed**: `the chunking context (unknown) does not support external modules (request: node:child_process)`.
2. The same import rewritten as `if (typeof window !== "undefined") return null; const { spawnSync } = await import("node:child_process"); ...`, same transitive import → `npm run build` **succeeded**.
3. A throwaway Vitest test calling that exact guarded function (no `window` global in this repo's default Vitest environment — confirmed by reading `vitest.config.ts`, which sets no `environment`, so Vitest defaults to `"node"`) → the dynamic import resolved and `spawnSync` executed successfully.

Both throwaway files/tests were removed after the experiment; no probe code ships in the final diff.

**Conclusion**: `ClaudeImplementerRuntimeProvider` is one real class, constructed directly in the controller exactly like `GitHubIssueSyncProvider` in Specs 061/062 (no dependency-injection stub needed). Internally it checks `typeof window !== "undefined"` first; in a real browser session this is always true, so it returns `Blocked` immediately without ever attempting the dynamic import. In this repository's Vitest suite (and in the documented manual smoke-test script, both genuinely Node), the browser guard alone is false — see Decision 4 below for the second, deliberately added gate that governs what happens next. This mirrors the existing pipeline's own established precedent of representing environment evidence at the provider boundary (`RepresentedRuntimeEnvironmentProvider` in Runtime Preflight already fabricates `detectionExitCode: 0`, `clean: true`, etc. rather than performing real OS inspection) — Spec 075 is the first stage to make that boundary *sometimes* real (in Node) rather than *always* represented, and documents exactly which runtime makes it real.

### Decision 4 — A second, explicit env-var gate, added after a real incident during this feature's own development

The `typeof window !== "undefined"` guard (Decision 2) only distinguishes "browser" from "Node" — it does **not** distinguish "this repository's own automated test suite, running in Node" from "a human deliberately running the documented manual smoke test, also in Node." Both are genuine Node contexts where the guard is false.

This gap was not theoretical: while drafting the controller-level integration tests for this feature, an early test that exercised the controller's default-wired `ImplementerRuntimeService`/`ClaudeImplementerRuntimeProvider` pair (i.e., using the real, unmodified `claude --dangerously-skip-permissions -p ...` command configuration) without mocking anything, in this real Vitest/Node environment — and it spawned **five real, live, unsupervised Claude Code agent processes** against this actual worktree in roughly 90 seconds before being caught, killed, and confirmed (via `git status`/`git diff --stat`) to have made no file changes.

`ClaudeImplementerRuntimeProvider` therefore requires a second, independent, explicit opt-in before it will ever resolve the real `node:child_process` import: the environment variable `AIVERSE_ALLOW_IMPLEMENTER_RUNTIME_SPAWN` must be set to exactly `"1"`. This check is layered *in addition to*, not instead of, the browser guard — both must pass (not a browser, **and** the env var is set) before a real spawn is attempted; an explicitly-injected test `spawnSyncImpl` (constructor parameter, used throughout `ClaudeImplementerRuntimeProvider.test.ts` for deterministic unit tests) bypasses both checks entirely, since supplying a test double is itself already an explicit, controlled substitution with no real-process risk.

This is what makes "explicit human action" a property enforced by the code, not merely by which UI input was pressed: even a fully-wired controller, driven all the way to a genuine `startImplementerPressed` dispatch, cannot cause a real spawn unless a human has also separately exported this variable — something no test file, `npm test` run, or CI job does by default. The documented manual smoke test (`quickstart.md`) is updated to instruct setting this variable as an explicit first step, and the one test that legitimately needs the real spawn path (`OfficeProjectPortalController.implementer-runtime.test.ts`'s end-to-end wiring test, and two focused tests in `ClaudeImplementerRuntimeProvider.test.ts`) each set and restore it locally around a single, harmless, instantly-exiting command (`node --version`), never the real Claude command.

### Decision 3 — The approved role binding is explicit request data, never derived from the existing `Implementer`/`Reviewer` labels

Every existing Execution Plan/Approval/Preflight/Runtime Start record sets `implementerAgent`/`reviewerAgent`/`implementer`/`reviewer` to the literal, invariant strings `"Implementer"`/`"Reviewer"` (confirmed by reading all five controller call sites) — these are generic role labels, not agent identities. The only place those labels are ever resolved to a concrete agent name is `RuntimePreflightProvider.normalizeAgentCommand`, which **hardcodes** the repository's default mapping: label `"implementer"` → `"codex"`, label `"reviewer"` → `"claude"`.

That hardcoded function is exactly the "repository default agent-role mapping" the spec instructs this feature not to rely on. Reusing it, or writing a parallel resolver that maps the same label `"Implementer"` to `"claude"` instead, would make the approved-role check pass unconditionally for every Runtime Start this pipeline can currently produce — a check that cannot fail on a real input is not enforcing anything, and reads as exactly the "silently swap roles inside the runtime service" the spec prohibits.

Instead, the approved binding travels as **explicit data**, sourced from new controller-level constants (`IMPLEMENTER_RUNTIME_APPROVED_IMPLEMENTER_AGENT = "claude"`, `IMPLEMENTER_RUNTIME_APPROVED_REVIEWER_AGENT = "codex"`, alongside the existing `EXECUTION_PLAN_VALIDATION_COMMANDS`-style constants) and carried on the `ImplementerRuntimeRequest`. `ImplementerRuntimeService` verifies:

- `approvedImplementerAgent === "claude"` and `approvedReviewerAgent === "codex"` (otherwise `implementer_runtime_claude_not_implementer` / `implementer_runtime_codex_reviewer_mismatch`);
- the two are distinct (`implementer_runtime_role_mismatch` if the same agent is bound to both);
- the generic role labels are internally consistent across plan/approval/preflight/Runtime Start (`plan.implementerAgent === approval.implementerAgent === runtimeStart.implementer`, etc.) — this is the same consistency `RuntimeStartService.validateApproval` already enforces via `RUNTIME_START_ROLE_CONTEXT_MISMATCH`, reused here as a precondition, not reimplemented;
- the command actually handed to the provider is the one configured for `approvedImplementerAgent` (`"claude"`), never the one `normalizeAgentCommand` would have produced for the generic label (`"codex"`) — this is the test that proves the default mapping was not silently consulted.

`normalizeAgentCommand` is left untouched and is not imported by this feature.

## Command Safety

`isSafeCommandLine` (exported from `runtime-preflight/RuntimePreflightProvider.ts`) is imported and reused as-is — it already rejects destructive git verbs, `gh pr create/merge/ready`, `gh issue edit`, `gh repo edit`, `rm -rf`, `del /s`, `format`, `shutdown`, `invoke-webrequest`, and `curl ...github`. It does **not** cover shell chaining (`&&`, `;`, `|`), command substitution (`` ` ``, `$()`), `-EncodedCommand`, or path traversal (`..`), all of which this spec's own reject list requires. `ClaudeImplementerRuntimeProvider`'s command-safety step therefore layers a small, focused additional check (`isSafeImplementerCommand`, in `ClaudeImplementerRuntimeProvider.ts`) covering exactly those additional patterns on top of `isSafeCommandLine`, rather than duplicating its existing regex set.

## Claude CLI Configuration

The repository's canonical Claude CLI convention (`tools/agent-workflow/agentRunner.js`, `DEFAULT_AGENT_RUNNERS.claude`) is `command: "claude"`, `args: ["--dangerously-skip-permissions", "-p", "{{prompt}}"]`, `inputMode: "argument"`. This spec's approved Claude command configuration matches that convention exactly (same command, same input mode, same placeholder substitution), asserted by a test that the exact validated argument vector equals the exact spawned argument vector. This configuration is a controller-level constant, not re-derived per request.

## Validation Order

Controller flow (mirrors Runtime Start's own documented order, with the two new steps appended):

```text
Execution Plan command-time revalidation
-> Execution Readiness command-time re-evaluation
-> Human Execution Approval revalidation
-> Runtime Preflight current re-execution
-> Runtime Start current re-execution (requires prior Ready preflight + Started/AlreadyStarted)
-> Implementer/Reviewer approved role-binding verification
-> Claude command configuration + command-safety validation
-> prompt construction
-> Claude provider invocation
-> bounded result mapping
```

No provider invocation occurs if any upstream step blocks. `ImplementerRuntimeService` is not invoked at all unless a current `RuntimeStart` with status `Started` or `AlreadyStarted` already exists for the exact context.

## Explicit Human Action

`OfficeProjectPortalInput` gains a new field, `startImplementerPressed: boolean`, entirely distinct from `enterPressed`/`actionPressed` (which together drive the existing Plan→Readiness→Approval→Preflight→Start cascade). The dashboard input handler only attempts an Implementer Runtime start when this new field is true, never as a side effect of the existing Enter/Action cascade reaching Runtime Start. The actor label passed is the same provider-neutral `"Local Human"` constant Runtime Start uses; it is rejected by the same `codex|claude|agent|bot|automation` pattern (extended with `workflow`, per this spec's own actor reject list) if it were ever anything else.

## State and Storage

`ImplementerRuntime`/`ImplementerRuntimeResult` collections are project-scoped (`Record<projectId, ImplementerRuntimeCollection>` / `Record<projectId, ImplementerRuntimeResultCollection>`), immutable, and stored in `ProjectPortalState` exactly like every prior stage. `clearRuntimePreflightForProject` (the existing shared invalidation helper, already responsible for wiping preflight and Runtime Start state on plan invalidation) is extended to also delete both new collections, so a stale plan cannot leave a stale Implementer Runtime record visible.

## Dashboard Strategy

Add `[IMPLEMENTER RUNTIME]` immediately after the existing `[RUNTIME START]` row, `dropPriority: 15` (one past Runtime Start's `13`/Execution Readiness's `14`, the current highest pipeline-stage priority), `usePriorityFit: true`, `maxLines: 1` — making it the single most disposable pipeline row if the panel overflows, appropriate since it is the newest addition and the five upstream rows remain visible as fallback context. Row text is composed from short clauses (`Claude Implementer Completed`, `Changes Require Validation`, `Codex Reviewer Not Started`, `Remote Mutation Disabled`) whose worst-case joined length is computed against the existing 78-character wrap budget before writing, the same way Spec 062's issue rows were bounded.

A realistic full-layout regression test (both `[RUNTIME START]` and `[IMPLEMENTER RUNTIME]` present, using the containment helper already established in `OfficeProjectPortalView.test.ts`, not a presence-only string check) closes the non-blocking dashboard-layout coverage finding noted in Spec 074.

## Validation Strategy

Run focused Implementer Runtime types/provider/service/view/controller tests during implementation. Before independent review run `npm test`, `npx tsc --noEmit`, `npm run build`, `git diff --check`, and `git diff --cached --check`. All `tasks.md` checkboxes, including the final validation-gate task, are checked before the review-round commit — not after — so an exact-HEAD-approved commit is never followed by a documentation-only recommit (a lesson carried over from Spec 062, where a post-approval checkbox commit required a second review round).

## Complexity Tracking

No constitution violations. The one added dependency (`node:child_process`, guarded) is documented above with its empirical justification.
