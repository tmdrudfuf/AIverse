# Implementation Plan: Spec 082 - Validation Runtime Foundation

**Branch**: `codex/082-validation-runtime-foundation` | **Date**: 2026-08-08 | **Spec**: `specs/082-validation-runtime-foundation/spec.md`
**Input**: Feature specification from `/specs/082-validation-runtime-foundation/spec.md`

## Summary

Introduce a provider-neutral Validation Runtime directly after Spec 081 Review Fix Runtime. The runtime validates only the exact completed review-fix result, rechecks the chain at command time, executes only the configured validation command snapshot, and records immutable runtime/result/evidence without starting review or GitHub publication.

## Technical Context

**Language/Version**: TypeScript 5.8, Next.js 16, Vitest
**Primary Dependencies**: existing office runtime-chain services
**Storage**: in-memory portal state collections
**Testing**: Vitest focused tests plus full repository validation
**Platform**: browser UI with Node-only provider spawn guarded by explicit env opt-in

## Constitution Check

- Primary checkout writes are forbidden; all work occurs in the dedicated feature worktree.
- Runtime behavior must be explicit, provider-neutral, immutable, and bounded.
- No GitHub mutation, review start, promotion, push, merge, deploy, branch deletion, or worktree cleanup occurs in the product runtime.
- Existing runtime-chain helpers are reused instead of parallel architecture.

## Project Structure

```text
src/features/city-view/scene/office/validation-runtime/
  ValidationRuntimeProvider.ts
  ValidationRuntimeService.ts
  ValidationRuntimeTypes.ts
  ValidationRuntimeView.ts
  *.test.ts

specs/082-validation-runtime-foundation/
  spec.md
  plan.md
  research.md
  data-model.md
  contracts/
  quickstart.md
  tasks.md
  review.md
  checklists/
```

## Design

ValidationRuntimeService accepts the existing Review Fix Runtime input chain plus runtime/result collections. It resolves the current Review Fix Request, Review Fix Plan, Review Fix Runtime, and Review Fix Runtime Result with canonical helpers, re-runs the plan revalidation path, and blocks unless all references still match. The provider boundary receives parsed configured validation commands and returns bounded command evidence.

## Validation

Focused validation:

```powershell
npm test -- ValidationRuntime OfficeActionInputController OfficeProjectPortalController.review-decision OfficeProjectPortalView
```

Full validation:

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```
