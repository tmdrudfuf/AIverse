# Implementation Plan: Runtime Start Foundation

**Branch**: `codex/074-runtime-start-foundation` | **Date**: 2026-07-30 | **Spec**: [spec.md](./spec.md)

## Summary

Add a focused Runtime Start layer that records an explicit human transition after current Ready Runtime Preflight. Runtime Start sets the product-level `executionStarted` flag while preserving the agent-not-started and mutation-not-started boundaries.

## Technical Context

**Language/Version**: TypeScript in the existing Next.js/Phaser application.

**Primary Dependencies**: Existing office portal services, state, and Vitest test setup.

**Storage**: In-memory per-project portal state and immutable local collections.

**Testing**: Vitest focused tests, full `npm test`, TypeScript, build, and diff checks.

**Target Platform**: Existing browser/game runtime.

**Project Type**: Web application with Phaser office portal UI.

**Performance Goals**: Runtime Start operations remain synchronous and bounded to current in-memory state plus the existing Runtime Preflight provider path.

**Constraints**: No Codex/Claude invocation, subprocess spawning, validation command execution, repository mutation, or GitHub mutation.

**Scale/Scope**: One Runtime Start record per exact Execution Plan context per project.

## Constitution Check

- Spec First: Passed. `spec.md` defines user value, acceptance scenarios, boundaries, and measurable outcomes.
- Plan Before Code: Passed. This plan documents ownership, architecture reuse, validation, and safety before implementation.
- Tasks Gate Implementation: Passed after `tasks.md` exists.
- Preserve Application Stability: Passed by extending existing office portal modules only.
- Validation Required: Passed by focused and full validation plan.

## Project Structure

### Documentation

```text
specs/074-runtime-start-foundation/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── runtime-start.md
└── tasks.md
```

### Source Code

```text
src/features/city-view/scene/office/
├── runtime-start/
│   ├── RuntimeStartTypes.ts
│   ├── RuntimeStartService.ts
│   ├── RuntimeStartView.ts
│   └── *.test.ts
├── runtime-preflight/
├── OfficeProjectPortalController.ts
├── OfficeProjectPortalRegistry.ts
├── OfficeProjectPortalTypes.ts
└── OfficeProjectPortalView.ts
```

## Architecture

Add a focused `runtime-start` domain module. Reuse Execution Plan, Execution Readiness, Human Execution Approval, Runtime Preflight, ProjectTask, active session, employee, repository context, validation commands, mutation scope, controller, dashboard, and project-isolation conventions.

## Validation Order

Controller flow:

```text
Execution Plan command-time revalidation
-> Execution Readiness command-time re-evaluation
-> Human Execution Approval revalidation
-> Runtime Preflight current re-execution
-> require Ready
-> Runtime Start service
```

The Runtime Start service will also validate exact context and actor safety. The Runtime Start service is not invoked after upstream blocks.

## State and Storage

Runtime Start records and results are immutable and stored in project-scoped collections. Collections use deterministic latest-result replacement by Runtime Start/result ID. Historical immutable records are preserved by value; current applicable state is replaced or cleared when upstream revalidation blocks.

## Dashboard Strategy

Add `[RUNTIME START]` rows after Runtime Preflight rows. Rows use bounded reason text, preserve priority-aware overflow, and always pair `Execution Started` with `Agents Not Started`.

## Validation Strategy

Run focused Runtime Start service/view/controller tests during implementation. Before independent review run `npm test`, `npx tsc --noEmit`, `npm run build`, `git diff --check`, and `git diff --cached --check`.

## Complexity Tracking

No constitution violations.
