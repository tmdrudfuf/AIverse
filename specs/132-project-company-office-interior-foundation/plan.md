# Implementation Plan: Project Company Office Interior Foundation

**Branch**: `codex/132-project-company-office-interior-foundation` | **Date**: 2026-08-28 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/132-project-company-office-interior-foundation/spec.md`

## Summary

Add a typed interior foundation to office definitions and render it in the existing company office scene as non-interactive, spatially anchored zone markers. The implementation extends current office metadata and `OfficeVisualLayer` so Daily Proof has visible reception, founder desk, workspace, and employee desk areas without changing movement, portal, ADOS, repository, GitHub, or persistence behavior.

## Technical Context

**Language/Version**: TypeScript 5.8, Next.js 16, React 19, Phaser 3.90

**Primary Dependencies**: Existing `OfficeDefinition`, `officeConfig`, `OfficeVisualLayer`, `CompanyOfficeScene`, Vitest

**Storage**: N/A

**Testing**: Focused Vitest coverage for office interior foundation metadata and office visual rendering

**Target Platform**: Browser-based AIverse app

**Project Type**: Single Next.js application

**Performance Goals**: Interior zone rendering is synchronous scene setup work and adds only a small fixed number of Phaser primitives.

**Constraints**: Mutate only the feature worktree. Do not modify the primary repository. Do not start review, publish, merge, deploy, mutate GitHub, or run the full configured ADOS validation pipeline from this runtime.

**Scale/Scope**: One existing office definition, optional metadata for future offices, non-interactive visual rendering only.

## Constitution Check

- Spec first: passed; `spec.md` and requirements checklist exist for feature 132.
- Plan before code: passed; affected source and validation surfaces are documented before implementation.
- Tasks gate implementation: pending until `tasks.md` exists.
- Preserve application stability: passed; changes are scoped to office metadata and visual rendering.
- Validation required: focused validation is listed below; full ADOS validation is intentionally deferred to ADOS per handoff policy.

## Project Structure

### Documentation (this feature)

```text
specs/132-project-company-office-interior-foundation/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- office-interior-foundation.md
|-- checklists/
|   `-- requirements.md
`-- tasks.md
```

### Source Code

```text
src/features/city-view/scene/office/
|-- officeTypes.ts
|-- officeConfig.ts
|-- OfficeInteriorFoundation.ts
|-- OfficeInteriorFoundation.test.ts
|-- OfficeVisualLayer.ts
`-- OfficeVisualLayer.test.ts
```

**Structure Decision**: Extend the existing office definition and visual layer instead of adding a new scene controller, because the feature is static visual metadata and should not participate in input, movement, or portal state.

## Validation

Focused validation in this runtime:

```powershell
npx vitest run src/features/city-view/scene/office/OfficeInteriorFoundation.test.ts src/features/city-view/scene/office/OfficeVisualLayer.test.ts
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
