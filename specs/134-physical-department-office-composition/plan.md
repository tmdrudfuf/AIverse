# Implementation Plan: Physical Department Office Composition

**Branch**: `codex/134-physical-department-office-composition` | **Date**: 2026-08-28 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/134-physical-department-office-composition/spec.md`

## Summary

Add optional physical department-area metadata to office layout snapshots and define future growing-company department composition for frontend engineering, backend engineering, design, and QA. Keep the change limited to layout metadata and read-only service accessors.

## Technical Context

**Language/Version**: TypeScript 5.8, Next.js 16, React 19, Phaser 3.90

**Primary Dependencies**: Existing `OfficeLayoutService`, `OfficeLayoutTypes`, Vitest

**Storage**: N/A

**Testing**: Focused Vitest coverage for layout department metadata and defensive reads

**Target Platform**: Browser-based AIverse app

**Project Type**: Single Next.js application

**Performance Goals**: Static metadata cloning remains synchronous and small.

**Constraints**: Mutate only the feature worktree. Do not modify the primary repository. Do not start review, publish, merge, deploy, mutate GitHub, or run the full configured ADOS validation pipeline from this runtime.

**Scale/Scope**: One domain type extension, one layout service update, one focused test file, and Spec Kit traceability.

## Constitution Check

- Spec first: passed; this spec restores the missing 134 feature artifact before source edits.
- Plan before code: passed; affected source and validation surfaces are documented before implementation.
- Tasks gate implementation: passed once `tasks.md` exists.
- Preserve application stability: passed; changes are scoped to office layout metadata.
- Validation required: focused validation is listed below; full ADOS validation is intentionally deferred to ADOS per handoff policy.

## Project Structure

### Documentation (this feature)

```text
specs/134-physical-department-office-composition/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- physical-department-office-composition.md
|-- checklists/
|   `-- requirements.md
`-- tasks.md
```

### Source Code

```text
src/features/city-view/scene/office/layout/
|-- OfficeLayoutTypes.ts
|-- OfficeLayoutService.ts
`-- OfficeLayoutService.test.ts
```

**Structure Decision**: Extend the existing layout service because departments are physical layout composition metadata and should not introduce a new runtime controller yet.

## Validation

Focused validation in this runtime:

```powershell
npx vitest run src/features/city-view/scene/office/layout/OfficeLayoutService.test.ts
git diff --check
```

Full ADOS validation, outside this runtime:

```powershell
npm test
npx tsc --noEmit
npm run build
npm run test:e2e:home-canvas
git diff --check
git diff --cached --check
```

## Complexity Tracking

No constitution violations.
