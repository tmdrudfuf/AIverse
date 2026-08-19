# Implementation Plan: Candidate Detail Approve Defer Reject Controls

**Branch**: `codex/106-candidate-detail-approve-defer-reject-controls` | **Date**: 2026-08-18 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/106-candidate-detail-approve-defer-reject-controls/spec.md`

## Summary

Add explicit Approve, Defer, and Reject controls to the existing candidate detail view. The implementation reuses the current candidate promotion decision service and keeps dashboard Enter/Space progression behavior unchanged by introducing detail-only input flags and keyboard mappings.

## Technical Context

**Language/Version**: TypeScript 5.8, Next.js 16, React 19, Phaser 3.90

**Primary Dependencies**: Existing `OfficeActionInputController`, `CompanyOfficeScene`, `OfficeProjectPortalController`, `OfficeProjectPortalView`, candidate promotion modules, Vitest

**Storage**: Existing in-memory candidate promotion decision records plus browser office session persistence already used by promotion decisions; no new storage surface

**Testing**: Focused Vitest coverage added/updated for controller and view behavior; ADOS validation is not run from this runtime by handoff policy

**Target Platform**: Browser-based AIverse app and local developer workflow

**Project Type**: Single Next.js application

**Performance Goals**: O(1) to O(n) lookup across currently loaded candidate promotion rows, bounded by local dashboard collections

**Constraints**: Mutate only the feature worktree. Do not run validation, start review, publish, merge, deploy, mutate GitHub, or modify the primary repository from this runtime.

**Scale/Scope**: Candidate detail decision controls only; no new promotion rules, no ProjectTask creation from detail actions, no agent runtime starts, no repository/GitHub mutation, and no deployment

## Constitution Check

- Spec first: passed; `spec.md` and requirements checklist exist before code.
- Plan before code: passed; source and validation surfaces are identified before implementation.
- Tasks gate implementation: pending until `tasks.md` exists.
- Preserve application stability: passed; changes are scoped to candidate detail controls over existing promotion decisions.
- Validation required: documented below, but not executed in this ADOS runtime by handoff policy.

## Project Structure

### Documentation (this feature)

```text
specs/106-candidate-detail-approve-defer-reject-controls/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- candidate-detail-decision-controls.md
|-- checklists/
|   `-- requirements.md
`-- tasks.md
```

### Source Code

```text
src/features/city-view/scene/office/
|-- OfficeActionInputController.ts
|-- CompanyOfficeScene.ts
|-- OfficeProjectPortalController.ts
|-- OfficeProjectPortalController.project-dashboard.test.ts
|-- OfficeProjectPortalView.ts
`-- OfficeProjectPortalView.test.ts
```

**Structure Decision**: Keep detail decisions in the existing portal controller because the controller already owns candidate promotion decision recording, browser-session persistence, and view refresh after candidate decision changes.

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
