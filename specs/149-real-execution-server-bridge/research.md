# Research: Real Execution Server Bridge

## Decision 1: Where the real process runs

**Decision**: Add a Next.js App Router API route under `src/app/api/runtime/` that runs server-side (Node.js runtime) and is the *only* place that can reach `node:child_process`. The browser client keeps using the existing `ImplementerRuntimeProvider`/`ReviewerRuntimeProvider` contracts, but is wired (in `OfficeProjectPortalRegistry.createLinkedServices`) to a new provider implementation whose `invoke()` calls that API route over `fetch`, instead of calling `node:child_process` itself.

**Rationale**: `OfficeProjectPortalController`/`View`/`Registry` are bundled into the browser client (already documented in Spec 075's plan.md, Architecture Decision 2), so `node:child_process` can never be statically imported anywhere in that graph without breaking `npm run build`. A server route is the only boundary that is reachable from the browser (via fetch) but never shipped to it. This is exactly the architecture the project's own roadmap (`docs/roadmap.md`, Phase 3) already calls for: "Add a server-side adapter for Codex CLI... Keep Codex credentials and execution capabilities outside the browser."

**Alternatives considered**:
- *Relax the `typeof window !== "undefined"` guard in `ClaudeImplementerRuntimeProvider`/`CodexReviewerRuntimeProvider` so they can run directly in the browser.* Rejected: this would put real process-spawning capability directly in the browser's own JS context, reachable by anything that can execute script there. The existing guard is a deliberate, already-reviewed safety boundary (see its own comment: a real spawn is "a genuinely consequential action" and this guard is what "actually enforces 'explicit human action' at the code level"). Removing it is out of scope for this feature and would weaken an existing safety guarantee the spec requires preserving.
- *A separate standalone companion process (not part of the Next.js app) that the browser talks to.* Rejected for now: adds a second process the operator has to remember to start, for no benefit over an API route in the app they already run with `npm run dev` / `npm start`.

## Decision 2: How the real subprocess is executed and made cancellable

**Decision**: Write a small, new, purpose-built async process runner for this feature (not a modification of `ClaudeImplementerRuntimeProvider`'s existing `spawnSync`-based `invoke()`, and not a reuse of `tools/agent-workflow/agentRunner.js`'s `runWorkflowAgent`). The new runner uses `node:child_process.spawn` (async) with the same timeout/grace-period/SIGTERM-then-SIGKILL shutdown pattern already proven in `tools/agent-workflow/agentRunner.js`'s `createDefaultProcessAdapter`, but returns a handle the API route can use to request cancellation of one specific in-flight run on demand (not only on timeout).

**Rationale**:
- `ClaudeImplementerRuntimeProvider`'s existing `invoke()` uses `spawnSync`, which blocks the single Node process running the API route for the full duration of the call. On that single process, a concurrent "cancel" request could never be serviced while a run is in flight — `spawnSync` would have to finish (by completing or by its own timeout) before the server could even read the cancel request. This fails User Story 3 / FR-007 (operator-initiated cancel, independent of timeout).
- `tools/agent-workflow/agentRunner.js`'s `createDefaultProcessAdapter` already solves the async/timeout/grace-period part correctly and is heavily proven (used by every `run-review`/`orchestrate` execution in this repository, including Spec 148's own review). But it is purpose-built for this repository's own Spec Kit meta-workflow (`runWorkflowAgent` writes into `.agent-workflow/runs/<featureId>/...` and threads `state.json`/`agentExecutions`) and its `run()` does not hand the caller a reference to the live child process, so there is no external "cancel this one" hook today — only timeout and whole-parent-process signals are wired.
- Modifying `agentRunner.js` to add an external-cancel hook was considered and rejected: it is this repository's own meta-development tooling (building AIverse itself), a different bounded context from a feature that lets the *operator* run Implementer/Reviewer against *their own* registered projects. Changing it risks regressing already-reviewed, already-relied-upon tooling for an unrelated purpose.
- A small new runner, scoped to this feature's own files, reuses the proven shutdown pattern (SIGTERM, grace period, then SIGKILL; capture stdout/stderr; report an honest `terminationReason`) without touching either existing, already-tested module. This is the smallest change that satisfies FR-005/006/007/008 together.

**Alternatives considered**:
- *Run `spawnSync` inside a `worker_thread` so the main request-handling thread stays free.* Rejected: Node's `worker_threads` adds real complexity (message-passing, thread lifecycle) to solve a problem `child_process.spawn` already solves natively, and killing a worker thread does not cleanly guarantee the OS child process it spawned synchronously is also killed.
- *Accept no mid-flight cancel for v1 (timeout only) and narrow User Story 3/FR-007 in the spec.* Rejected: the async runner is not meaningfully more code than the alternative, so there is no real complexity saved by cutting the requirement.

## Decision 3: Reusing existing safety/validation logic

**Decision**: The new API route imports and reuses the existing, already-tested command/path safety validators (`isSafeImplementerCommand`, `isSafeCommandLine`, path-traversal checks in `ClaudeImplementerRuntimeProvider.ts` / `RuntimePreflightProvider.ts`) rather than writing new validation logic.

**Rationale**: These functions already encode the project's reviewed safety rules for what an Implementer/Reviewer command invocation is allowed to look like. Re-deriving equivalent checks in the new route would be duplicated logic with a real chance of drifting out of sync with the original.

## Decision 4: Enablement flag stays server-only

**Decision**: Reuse the existing `AIVERSE_ALLOW_IMPLEMENTER_RUNTIME_SPAWN` environment variable name and semantics, but read it *only* inside the new server route (never via a `NEXT_PUBLIC_`-prefixed variable, which Next.js would inline into the browser bundle). A new `GET /api/runtime/status` route exposes only the derived boolean, never the raw environment.

**Rationale**: Satisfies FR-002/FR-003 without inventing a second enablement mechanism, and keeps the existing env var's documented meaning ("Real Claude CLI spawn requires this to be set explicitly") intact and consistent between the already-tested provider and the new server route.

## Decision 5: Per-project concurrency guard and audit trail location

**Decision**: An in-memory `Map<projectId, RunHandle>` on the server process enforces "at most one real run per registered project" (FR-005); on every terminal state (completed/failed/timed-out/cancelled/refused) the run's full record is additionally written to `.agent-workflow/real-runs/<projectId>/<runId>.json`, mirroring the existing `.agent-workflow/runs/<featureId>/...` convention already used by this repository's own tooling.

**Rationale**: An in-memory map is sufficient because this feature's explicit assumption (see spec.md) is a single operator running a single local server process, not a multi-instance deployment; a database would be a new dependency with no corresponding need. Reusing the `.agent-workflow/` directory convention (already gitignored, already the established place this repo keeps run evidence) satisfies FR-009 without inventing a new storage location or format.
