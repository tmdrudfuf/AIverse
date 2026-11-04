# Implementation Plan: GitHub Write Integration

**Branch**: `codex/150-github-write-integration` | **Date**: 2026-11-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/150-github-write-integration/spec.md`

## Summary

Spec 149 proved real execution works: an approved run genuinely modifies the operator's own registered real project on disk. This plan adds the next, decoupled piece: a server-side publish bridge that, in direct response to one explicit operator action, creates a branch, commits any outstanding local changes, pushes it to the project's real GitHub remote, and opens a real pull request — by reusing the operator's own already-authenticated `git`/`gh` CLI (no new token store) and Spec 149's existing, generic `RuntimeBridgeProcessRunner`. The server itself decides every command it runs; the client only ever names which registered project to publish for. Merge, approval, ready-for-review, and branch deletion remain exclusively the operator's own actions on GitHub, unchanged.

## Technical Context

**Language/Version**: TypeScript (strict), existing project configuration; Node.js (server route runtime)

**Primary Dependencies**: Next.js App Router (existing), Node's built-in `node:child_process` via the already-existing `runRuntimeBridgeProcess`. No new npm dependency. Reuses the operator's own locally-installed `git` and `gh` CLI (already required/used elsewhere in this repo's own workflow).

**Storage**: No database. One new flat audit directory, `.agent-workflow/github-publishes/<attemptId>.json`, mirroring Spec 149's `.agent-workflow/real-runs/` convention.

**Testing**: Vitest, following Spec 149's established pattern: real, harmless subprocesses (e.g. a scratch git repo this test suite creates itself) rather than mocking `child_process`, wherever a real process can stand in safely; a fake/stub process adapter only where a real `git`/`gh` call cannot safely be exercised in CI (e.g. anything that would attempt a real network push).

**Target Platform**: The operator's own machine, same as Spec 149.

**Project Type**: Existing single Next.js web application; adds another small API surface alongside `src/app/api/runtime/`.

**Performance Goals**: Not throughput-sensitive; one publish attempt per project at a time by design (FR-008).

**Constraints**: Must not expose git/GitHub write capability to the browser bundle (same boundary as Spec 149 — server-only, `_lib` pattern). Must not introduce a new credential store (research.md Decision 1). Must never construct a command from client-supplied strings (research.md Decision 2).

**Scale/Scope**: Single operator, their own registered real projects, one publish attempt per project at a time.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

- **I. Spec First**: `specs/150-github-write-integration/spec.md` exists, is user-facing, validated against the quality checklist. PASS.
- **II. Plan Before Code**: This document is written before any application code changes for this feature. PASS.
- **III. Tasks Gate Implementation**: `tasks.md` will be generated from this plan before implementation begins. PASS (gate to be satisfied next).
- **IV. Preserve Application Stability**: Changes are scoped to new files (a new API route, a new small `_lib` module reusing `runRuntimeBridgeProcess`, a new UI control) plus one small office-UI addition mirroring Spec 149's T028/T029 pattern. No existing Spec 149 file is modified except where its own tests need a new fixture. PASS.
- **V. Validation Is Required**: Vitest coverage for the new route's decision logic and the publish-sequence module; `npx tsc --noEmit`; `npm run build`; a manual quickstart walkthrough (quickstart.md) for the one thing automated tests should not do — an actual push to a real GitHub remote and a real `gh pr create` call, left for the operator exactly as Spec 149's T027 was. PASS.

No deviations requiring Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/150-github-write-integration/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── github-publish-bridge.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── app/
│   └── api/
│       └── github-publish/
│           ├── _lib/
│           │   ├── GitHubPublishTypes.ts
│           │   ├── GitHubPublishSequence.ts       # the fixed create-branch/commit/push/open-PR sequence
│           │   ├── GitHubPublishSequence.test.ts
│           │   ├── GitHubPublishRegistry.ts        # per-project concurrency guard + audit-file writer (mirrors RuntimeBridgeRunRegistry)
│           │   └── GitHubPublishRegistry.test.ts
│           ├── preview/
│           │   ├── route.ts                        # GET: changed files + planned commit message (User Story 2)
│           │   └── route.test.ts
│           ├── status/
│           │   ├── route.ts                        # GET: { authorized: boolean } (gh auth status probe)
│           │   └── route.test.ts
│           └── publish/
│               ├── route.ts                         # POST: run the fixed sequence for one project
│               └── route.test.ts
│
└── features/city-view/scene/office/
    ├── github-publish/                               # new, browser-side: fetch() wrappers only
    │   ├── GitHubPublishClient.ts
    │   └── GitHubPublishClient.test.ts
    ├── CompanyOfficeScene.ts                          # existing file: add a "Publish to GitHub" control
    └── OfficeProjectPortalController.ts                # existing file: expose the new client + its state to the scene
```

**Structure Decision**: Single existing Next.js project; mirrors Spec 149's structure exactly (server-only `_lib` under `app/api/`, a thin client-side `fetch()` wrapper colocated with the office feature, one small office-UI addition) rather than inventing a different shape for this feature.

## Complexity Tracking

*No Constitution Check violations. Table omitted.*
