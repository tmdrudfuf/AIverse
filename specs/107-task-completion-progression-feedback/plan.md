# Implementation Plan: Task Completion Progression Feedback

**Branch**: `codex/107-task-completion-progression-feedback` | **Date**: 2026-08-18 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/107-task-completion-progression-feedback/spec.md`

## Summary

Refresh company progression state at the moment a Review task is marked Done and surface a concise task-detail feedback row. The implementation reuses existing task status transitions, company progression services, trigger evaluation, and office visual/reward plumbing without introducing new runtime, repository, or external integration behavior.

## Technical Context

**Language/Version**: TypeScript 5.8, Next.js 16, React 19, Phaser 3.90

**Primary Dependencies**: Existing `OfficeProjectPortalController`, `OfficeProjectPortalView`, task modules, company progression modules, office progression visual/reaction layers, Vitest

**Storage**: Existing in-memory portal state plus browser office session persistence already used for task collections; no new storage surface

**Testing**: Focused Vitest coverage for controller task completion progression and view feedback rows; ADOS validation is not run from this runtime by handoff policy

**Target Platform**: Browser-based AIverse app and local developer workflow

**Project Type**: Single Next.js application

**Performance Goals**: O(n) over loaded task collections and reached progression snapshots only; no external network or filesystem work

**Constraints**: Mutate only the feature worktree. Do not run validation, start review, publish, merge, deploy, mutate GitHub, or modify the primary repository from this runtime.

**Scale/Scope**: Task completion feedback only; no new milestones, no validation/review/runtime starts, no repository/GitHub mutation, no deployment

## Constitution Check

- Spec first: passed; `spec.md` and requirements checklist exist before code.
- Plan before code: passed; affected source and validation surfaces are identified before implementation.
- Tasks gate implementation: pending until `tasks.md` exists.
- Preserve application stability: passed; changes are scoped to task completion progression feedback over existing services.
- Validation required: documented below, but not executed in this ADOS runtime by handoff policy.

## Project Structure

### Documentation (this feature)

```text
specs/107-task-completion-progression-feedback/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- task-completion-progression-feedback.md
|-- checklists/
|   `-- requirements.md
`-- tasks.md
```

### Source Code

```text
src/features/city-view/scene/office/
|-- OfficeProjectPortalController.ts
|-- OfficeProjectPortalController.project-dashboard.test.ts
|-- OfficeProjectPortalView.ts
|-- OfficeProjectPortalView.test.ts
|-- OfficeProjectPortalTypes.ts
`-- OfficeProjectPortalRegistry.ts
```

**Structure Decision**: Keep completion feedback in the existing portal controller and view because task status changes, progression snapshots, trigger state, and task detail rendering already meet there.

## Validation

Focused validation, outside this runtime:

```powershell
npx vitest run src/features/city-view/scene/office/OfficeProjectPortalController.project-dashboard.test.ts src/features/city-view/scene/office/OfficeProjectPortalView.test.ts
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
