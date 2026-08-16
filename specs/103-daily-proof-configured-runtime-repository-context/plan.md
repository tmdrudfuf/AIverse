# Implementation Plan: Daily Proof Configured Runtime Repository Context

**Branch**: `codex/103-daily-proof-configured-runtime-repository-context` | **Date**: 2026-08-15 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/103-daily-proof-configured-runtime-repository-context/spec.md`

## Summary

Configure Daily Proof with the feature 103 local repository binding and consume that binding when the project portal creates execution-plan repository context. The plan keeps the primary repository root distinct from the feature worktree, uses configured branch/spec metadata when local repository snapshots do not include branch data, and preserves existing stale-branch blocking when explicit evidence contradicts the configured branch.

## Technical Context

**Language/Version**: TypeScript 5.8, Next.js 16, React 19, Phaser 3.90

**Primary Dependencies**: Existing `LocalProjectRepositoryBinding`, `ProjectRegistryService`, `OfficeProjectPortalRegistry`, `OfficeProjectPortalController`, `ExecutionPlanService`, Vitest

**Storage**: In-memory project portal state only; no browser storage, filesystem writes, remote persistence, or environment-variable loading in this slice

**Testing**: Focused Vitest tests added/updated but ADOS validation runs outside this runtime

**Target Platform**: Browser-based AIverse app and local developer workflow

**Project Type**: Single Next.js application

**Performance Goals**: O(1) lookup of per-project configured context during execution-plan creation

**Constraints**: Mutate only the feature worktree. Do not run validation, start review, publish, merge, deploy, mutate GitHub, or modify the primary repository from this runtime.

**Scale/Scope**: Daily Proof configured runtime metadata and execution-plan consumption only; no UI flow, persistent settings, real filesystem validation, subprocess execution, repository mutation, GitHub mutation, or deployment

## Constitution Check

- Spec first: passed; `spec.md` and requirements checklist exist before code.
- Plan before code: passed; source and validation surfaces are identified before implementation.
- Tasks gate implementation: pending until `tasks.md` exists.
- Preserve application stability: passed; changes are scoped to configured repository context and existing execution-plan validation.
- Validation required: documented below, but not executed in this ADOS runtime by handoff policy.

## Project Structure

### Documentation (this feature)

```text
specs/103-daily-proof-configured-runtime-repository-context/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- runtime-repository-context.md
|-- checklists/
|   `-- requirements.md
`-- tasks.md
```

### Source Code

```text
src/features/city-view/scene/office/
|-- OfficeProjectPortalRegistry.ts
|-- OfficeProjectPortalRegistry.test.ts
|-- OfficeProjectPortalController.ts
|-- OfficeProjectPortalController.issue-sync.test.ts
`-- OfficeProjectPortalController.testHelpers.ts

src/features/city-view/scene/office/execution-plans/
|-- ExecutionPlanService.ts
`-- ExecutionPlanService.test.ts
```

**Structure Decision**: Keep configured Daily Proof metadata at portal-state creation because it is configured product state. Keep repository-context resolution in the controller because execution plans are built there, and adjust branch validation in `ExecutionPlanService` where plan acceptance rules already live.

## Validation

Focused validation, outside this runtime:

```powershell
npx vitest run src/features/city-view/scene/office/OfficeProjectPortalRegistry.test.ts src/features/city-view/scene/office/OfficeProjectPortalController.issue-sync.test.ts src/features/city-view/scene/office/execution-plans/ExecutionPlanService.test.ts
```

Full ADOS validation, outside this runtime:

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```

## Complexity Tracking

No constitution violations.
