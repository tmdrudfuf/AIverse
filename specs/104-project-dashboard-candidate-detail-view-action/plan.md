# Implementation Plan: Project Dashboard Candidate Detail View Action

**Branch**: `codex/104-project-dashboard-candidate-detail-view-action` | **Date**: 2026-08-15 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/104-project-dashboard-candidate-detail-view-action/spec.md`

## Summary

Add a read-only candidate detail drill-in from the Project Dashboard. The implementation reuses loaded candidate task, assignment, promotion, and promoted-task state, adds local selected candidate detail state, and keeps existing Enter-based candidate progression controls intact by using the existing action/Space input for detail navigation only.

## Technical Context

**Language/Version**: TypeScript 5.8, Next.js 16, React 19, Phaser 3.90

**Primary Dependencies**: Existing `OfficeProjectPortalController`, `OfficeProjectPortalView`, candidate task/assignment/promotion modules, project task collections, Vitest

**Storage**: In-memory project portal state only; no browser storage, filesystem writes, remote persistence, or environment-variable loading in this slice

**Testing**: Focused Vitest tests added/updated but ADOS validation runs outside this runtime

**Target Platform**: Browser-based AIverse app and local developer workflow

**Project Type**: Single Next.js application

**Performance Goals**: O(1) to O(n) lookup across currently loaded candidate/project task rows, bounded by local dashboard collections

**Constraints**: Mutate only the feature worktree. Do not run validation, start review, publish, merge, deploy, mutate GitHub, or modify the primary repository from this runtime.

**Scale/Scope**: Project Dashboard candidate detail view action only; no persistent settings, no real filesystem validation, no subprocess execution, no repository mutation, no GitHub mutation, no new promotion rules, and no deployment

## Constitution Check

- Spec first: passed; `spec.md` and requirements checklist exist before code.
- Plan before code: passed; source and validation surfaces are identified before implementation.
- Tasks gate implementation: pending until `tasks.md` exists.
- Preserve application stability: passed; changes are scoped to read-only candidate detail navigation.
- Validation required: documented below, but not executed in this ADOS runtime by handoff policy.

## Project Structure

### Documentation (this feature)

```text
specs/104-project-dashboard-candidate-detail-view-action/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- candidate-detail-ui.md
|-- checklists/
|   `-- requirements.md
`-- tasks.md
```

### Source Code

```text
src/features/city-view/scene/office/
|-- OfficeProjectPortalTypes.ts
|-- OfficeProjectPortalRegistry.ts
|-- OfficeProjectPortalController.ts
|-- OfficeProjectPortalController.project-dashboard.test.ts
|-- OfficeProjectPortalView.ts
`-- OfficeProjectPortalView.test.ts
```

**Structure Decision**: Keep candidate detail as portal-local view state because it is read-only navigation over existing in-memory dashboard data. Resolve candidate context in the view/controller boundary where task-detail and project-dashboard navigation already live.

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
