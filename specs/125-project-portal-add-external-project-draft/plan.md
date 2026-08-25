# Implementation Plan: Project Portal Add External Project Draft Action

**Branch**: `codex/125-project-portal-add-external-project-draft` | **Date**: 2026-08-24 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/125-project-portal-add-external-project-draft/spec.md`

## Summary

Add a keyboard-selectable Project Portal list action that inserts a single planned external project draft into the existing registry-backed portal state. The implementation will reuse the current registry entry shape, portal adapters, and browser session persistence added by spec 123. No custom form, repository binding, filesystem access, GitHub access, runtime start, or repository mutation is introduced.

## Technical Context

**Language/Version**: TypeScript 5.8, Next.js 16, React 19, Phaser 3.90

**Primary Dependencies**: Existing `OfficeProjectPortalController`, `OfficeProjectPortalView`, `OfficeProjectPortalTypes`, `BrowserOfficeSessionService`, `ProjectRegistryAdapters`, Vitest

**Storage**: Existing browser `localStorage` key `aiverse.office.session` through `BrowserOfficeSessionService`

**Testing**: Focused Vitest coverage added but ADOS validation runs outside this runtime

**Target Platform**: Browser-based AIverse app

**Project Type**: Single Next.js application

**Performance Goals**: Draft insertion is synchronous over a small project list with no visible portal delay

**Constraints**: Mutate only the feature worktree. Do not run validation, start review, publish, merge, deploy, mutate GitHub, or modify the primary repository from this runtime.

**Scale/Scope**: One default external project draft per portal state; no user-entered form fields, file validation, git reads, GitHub reads, cross-device sync, or repository mutation

## Constitution Check

- Spec first: passed; `spec.md` and requirements checklist exist before code.
- Plan before code: passed; source and validation surfaces are identified before implementation.
- Tasks gate implementation: pending until `tasks.md` exists.
- Preserve application stability: passed; changes are scoped to Project Portal list controls, draft state composition, and persistence.
- Validation required: documented below, but not executed in this ADOS runtime by handoff policy.

## Project Structure

### Documentation (this feature)

```text
specs/125-project-portal-add-external-project-draft/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- project-portal-add-external-project-draft.md
|-- checklists/
|   `-- requirements.md
`-- tasks.md
```

### Source Code

```text
src/features/city-view/scene/office/
|-- OfficeProjectPortalController.ts
|-- OfficeProjectPortalController.project-dashboard.test.ts
|-- OfficeProjectPortalRegistry.ts
|-- OfficeProjectPortalRegistry.test.ts
|-- OfficeProjectPortalTypes.ts
|-- OfficeProjectPortalView.ts
`-- project-registry/
    |-- ProjectRegistryAdapters.ts
    `-- ProjectRegistryTypes.ts
```

**Structure Decision**: Keep the action orchestration in `OfficeProjectPortalController.ts` because it owns list selection and activation. Keep rendering in `OfficeProjectPortalView.ts`, and reuse existing project registry adapters for derived portal rows and future browser persistence.

## Validation

Focused validation, outside this runtime:

```powershell
npx vitest run src/features/city-view/scene/office/OfficeProjectPortalController.project-dashboard.test.ts src/features/city-view/scene/office/OfficeProjectPortalRegistry.test.ts
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
