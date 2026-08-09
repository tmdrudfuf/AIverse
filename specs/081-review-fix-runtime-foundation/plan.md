# Implementation Plan: Review Fix Runtime Foundation

**Branch**: `codex/081-review-fix-runtime-foundation` | **Date**: 2026-08-07 | **Spec**: `specs/081-review-fix-runtime-foundation/spec.md`  
**Input**: Feature specification from `/specs/081-review-fix-runtime-foundation/spec.md`

## Summary

Add the first explicit Review Fix Runtime boundary downstream of Spec 080 Review Fix Plan. The feature records immutable provider-neutral runtime/result/evidence records for one bounded attempt to execute the exact current Review Fix Plan through the configured implementer-provider boundary. It starts only from a distinct human input after command-time revalidation of the current review-fix chain.

The feature does not run validation, reviewer runtime, review promotion, GitHub mutation, push, PR creation, Ready for Review, merge, deploy, branch deletion, or cleanup.

## Technical Context

**Language/Version**: TypeScript, Vite, Vitest  
**Primary Dependencies**: Existing office scene/controller services, Review Decision, Review Fix Request, Review Fix Plan, Implementer Runtime provider safety helpers  
**Storage**: In-memory immutable office project portal state maps  
**Testing**: Vitest via `npm test`; focused tests for review-fix runtime/controller/input/dashboard behavior  
**Target Platform**: Existing AIverse browser app  
**Project Type**: Frontend TypeScript application  
**Performance Goals**: No runtime start on render/refresh; provider spawn only after explicit action and preflight checks  
**Constraints**: Provider-neutral domain records, deterministic IDs, immutable collections, exact-context binding, no hidden repository or GitHub mutation outside local fix-runtime provider scope  
**Scale/Scope**: One runtime boundary for current project/review-fix plan context

## Constitution Check

- **Spec First**: `spec.md` defines user value, acceptance scenarios, safety boundaries, and success criteria before implementation.
- **Plan Before Code**: This plan identifies the minimal domain/service/controller/UI/test changes before product code changes.
- **Tasks Gate Implementation**: `tasks.md` decomposes work into dependency-ordered implementation and validation steps.
- **Preserve Stability**: Existing Review Fix Request/Plan, Review Decision, Runtime Chain Integrity, and Implementer Runtime patterns are reused.
- **Validation Required**: Focused tests plus `npm test`, `npx tsc --noEmit`, `npm run build`, `git diff --check`, and `git diff --cached --check` are required before commit/review.

## Project Structure

### Documentation

```text
specs/081-review-fix-runtime-foundation/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── contracts/
│   └── review-fix-runtime-contract.md
├── quickstart.md
├── tasks.md
├── checklists/
│   └── requirements.md
└── review.md
```

### Source

```text
src/features/city-view/scene/office/
├── review-fix-runtime/
│   ├── ReviewFixRuntimePrompt.ts
│   ├── ReviewFixRuntimeProvider.ts
│   ├── ReviewFixRuntimeService.ts
│   ├── ReviewFixRuntimeTypes.ts
│   ├── ReviewFixRuntimeView.ts
│   └── __tests__/
│       ├── ReviewFixRuntimeService.test.ts
│       └── ReviewFixRuntimeView.test.ts
├── OfficeActionInputController.ts
├── OfficeProjectPortalController.ts
├── OfficeProjectPortalRegistry.ts
├── OfficeProjectPortalTypes.ts
└── OfficeProjectPortalView.ts
```

## Design

### Runtime Domain

Add a focused `review-fix-runtime` module. The module owns provider-neutral runtime, result, evidence, command, collection, ID, and immutable upsert helpers. Runtime identities bind project ID and exact Review Fix Plan ID:

```text
<projectId>:review-fix-runtime:<reviewFixPlanId>:review-fix-runtime-v1
<projectId>:review-fix-runtime-result:<reviewFixRuntimeId>:review-fix-runtime-v1
```

The formula avoids random UUIDs, UI order, array position, timestamps, and human-readable labels. Since project ID is the first identity component, cross-project collisions are impossible.

### Service Boundary

`ReviewFixRuntimeService` performs:

1. actor validation before idempotency checks
2. current Review Decision classification
3. current Review Fix Request lookup and revalidation through `ReviewFixRequestService`
4. current Review Fix Plan lookup and revalidation through `ReviewFixPlanService`
5. exact snapshot comparison for project/task/repository/worktree/branch/SHA/provider/rules/mutation scope
6. command safety checks using existing implementer-runtime command validation
7. provider invocation only after all preflight checks pass
8. immutable runtime/result upsert

Pre-spawn failures produce blocked or failed results without runtime evidence claiming execution.

### Provider Boundary

Spec 081 reuses the existing implementer-provider execution boundary. The default Review Fix Runtime provider adapts the existing safe implementer provider semantics rather than introducing a second subprocess architecture. It preserves command traversal protection, working-directory validation, timeout handling, bounded evidence, role binding, and spawn gating.

### Controller/UI/Input

The controller adds one explicit start path and one active-attempt guard for review-fix runtime. The dashboard adds a `[REVIEW FIX RUNTIME]` row after Review Fix Plan readiness and before downstream candidate task rows. Existing higher-priority source/sync/focus/runtime/reviewer/review-decision/request/plan errors remain visible first.

The distinct key is `KeyX` (`X`). Existing occupied keys are `I`, `R`, `P`, `F`, and `G`; `X` avoids reusing a transition key.

## Complexity Tracking

No constitution violation is expected. The implementation is intentionally narrow and avoids generalizing the runtime system beyond the review-fix runtime boundary.
