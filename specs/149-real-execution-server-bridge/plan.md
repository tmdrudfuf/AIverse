# Implementation Plan: Real Execution Server Bridge

**Branch**: `codex/149-real-execution-server-bridge` | **Date**: 2026-11-03 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/149-real-execution-server-bridge/spec.md`

## Summary

The Implementer/Reviewer runtime providers that would let an approved run genuinely execute against one of the operator's own registered real local projects already exist and are already tested, but they are architecturally confined to a Node-only context the deployed browser app never runs in — so every real run reports `Blocked`. This plan adds a server-side API bridge (Next.js API routes, Node runtime) that the browser's existing provider contracts call into, reusing the project's existing safety validators and the proven async/timeout/grace-period subprocess shutdown pattern from `tools/agent-workflow/agentRunner.js`, without modifying either of those already-tested modules. The result: an approved run on a registered real project genuinely executes, with explicit per-machine enablement, a one-run-per-project concurrency guard, honest terminal statuses (including operator-initiated cancel), and a durable audit record — while the existing human-only publication boundary (no push/PR/merge/branch-delete from a run) is unchanged.

## Technical Context

**Language/Version**: TypeScript (strict), existing project configuration; Node.js (server route runtime)

**Primary Dependencies**: Next.js App Router (already a project dependency) for the new API routes; Node's built-in `node:child_process` for the new process runner. No new npm dependency is introduced.

**Storage**: No database. Enablement is read live from the existing, independent `AIVERSE_ALLOW_IMPLEMENTER_RUNTIME_SPAWN` / `AIVERSE_ALLOW_REVIEWER_RUNTIME_SPAWN` env vars on the server; per-run audit records are flat JSON files under `.agent-workflow/real-runs/<runId>.json` (same convention as the existing `.agent-workflow/runs/` directory; no project subfolder, since there is no server-side project id — see Constitution Check's note on `OfficeProjectPortalController.ts`).

**Testing**: Vitest (existing project test runner), following this codebase's existing pattern of a deterministic fake process adapter (as `tools/agent-workflow/agentRunner.test.ts` and `ClaudeImplementerRuntimeProvider.test.ts` already do) so tests never spawn a real process.

**Target Platform**: The operator's own machine, running the existing Next.js app locally (`npm run dev` / `npm start`); not a multi-tenant hosted deployment.

**Project Type**: Existing single Next.js web application. This feature adds a server API surface inside it; it does not introduce a separate backend project.

**Performance Goals**: Not throughput-sensitive. One real run is active per project at a time by design (FR-005); correctness (honest terminal status, no orphaned process) matters far more than concurrency.

**Constraints**: Must not expose process-spawning capability to the browser bundle (Decision 1, research.md). Must not require a new runtime dependency (constitution: "Do not introduce new frameworks, services, or runtime dependencies without a plan rationale" — none introduced here). Must preserve the existing human-only boundary on push/PR/merge/branch-delete (FR-010).

**Scale/Scope**: Single operator, their own registered real local projects (already supported by Spec 137's project registry/binding), one real run per project at a time.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

- **I. Spec First**: `specs/149-real-execution-server-bridge/spec.md` exists, is user-facing, and was validated against the quality checklist before this plan was written. PASS.
- **II. Plan Before Code**: This document is written, and no application code has been changed for this feature yet. PASS.
- **III. Tasks Gate Implementation**: `tasks.md` will be generated from this plan before any implementation task begins. PASS (gate to be satisfied next).
- **IV. Preserve Application Stability**: Changes are scoped to new files (three API routes, two process-runner/registry modules, two new thin provider adapters, their tests) plus targeted construction-site edits in `OfficeProjectPortalController.ts` (five existing `new ClaudeImplementerRuntimeProvider()`/`new CodexReviewerRuntimeProvider()` call sites, swapped to the new server-bridge providers — corrected during implementation from the original draft's `OfficeProjectPortalRegistry.ts`, which does not construct these providers) and one additive `export` keyword on `ClaudeImplementerRuntimeProvider.ts`'s existing `writeCommandFiles` function (reused, not changed). `ClaudeImplementerRuntimeProvider.ts`'s/`CodexReviewerRuntimeProvider.ts`'s safety-validation exports and `tools/agent-workflow/agentRunner.js`'s shutdown pattern are read and reused but not modified otherwise. PASS.
- **V. Validation Is Required**: Vitest coverage for the new process runner (fake adapter, no real spawn) and the new API routes' decision logic; `npx tsc --noEmit`; `npm run build`; a manual quickstart walkthrough (quickstart.md) covering the one path automated tests cannot (an actual real CLI invocation on a disposable scratch project) since AGENTS.md's required `npm test` is already covered by the former. PASS.

No deviations requiring Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/149-real-execution-server-bridge/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md         # Phase 1 output
├── quickstart.md         # Phase 1 output
├── contracts/            # Phase 1 output
│   └── real-execution-bridge.md
└── tasks.md              # Phase 2 output (/speckit-tasks — not created by this plan)
```

### Source Code (repository root)

```text
src/
├── app/
│   └── api/
│       └── runtime/
│           ├── _lib/                                 # server-only; never imported by client-bundled code
│           │   ├── RuntimeBridgeTypes.ts
│           │   ├── RuntimeBridgeProcessRunner.ts     # async spawn + timeout + grace period + external cancel
│           │   ├── RuntimeBridgeProcessRunner.test.ts
│           │   ├── RuntimeBridgeRunRegistry.ts        # per-project in-memory concurrency guard + audit-file writer
│           │   └── RuntimeBridgeRunRegistry.test.ts
│           ├── status/
│           │   └── route.ts                     # GET: { implementerEnabled, reviewerEnabled }
│           └── execute/
│               ├── route.ts                      # POST: start a real run
│               ├── route.test.ts
│               └── [runId]/
│                   ├── route.ts                  # DELETE: cancel one in-flight run
│                   └── route.test.ts
│
└── features/city-view/scene/office/
    ├── implementer-runtime/
    │   ├── ServerBridgeImplementerRuntimeProvider.ts         # browser-side: fetch()s the API route, no node imports
    │   └── ServerBridgeImplementerRuntimeProvider.test.ts
    ├── reviewer-runtime/
    │   ├── ServerBridgeReviewerRuntimeProvider.ts            # browser-side: fetch()s the API route, no node imports
    │   └── ServerBridgeReviewerRuntimeProvider.test.ts
    └── OfficeProjectPortalController.ts           # existing file: swap the five provider construction sites
```

**Structure Decision**: Single existing Next.js project; no new top-level project/package. The process-spawning code lives under `src/app/api/runtime/_lib/`, inside the `app/api` tree rather than colocated with the browser-bundled `*-runtime/` feature directories (a deliberate adjustment made during implementation, not the original plan draft): anything under `src/features/city-view/scene/office/` is reachable, transitively, from `OfficeProjectPortalController`/`View`/`Registry`, which are bundled into the browser client (Spec 075 plan.md, Architecture Decision 2). Keeping the only files that statically import `node:child_process` physically inside `src/app/api/` removes any risk of that import graph ever reaching the client bundle, with no need to rely on the dynamic-import-plus-`typeof window` trick those existing providers use for a different reason (they are legitimately reachable from the browser and must no-op there; this new code must never be reachable from the browser at all). The two new client-side provider files stay colocated with their existing `*-runtime/` siblings, since they are plain `fetch()` wrappers with no server-only imports.

## Complexity Tracking

*No Constitution Check violations. Table omitted.*
