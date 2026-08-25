# Implementation Plan: External Project Repository Identity Edit Overlay

**Branch**: `codex/126-external-project-repository-identity-edit-overlay` | **Date**: 2026-08-24 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/126-external-project-repository-identity-edit-overlay/spec.md`

## Summary

Add a keyboard-driven repository identity edit overlay for the Spec 125 external project draft. The implementation will add transient portal selection state, render a compact identity-choice overlay, update the draft registry entry through a small helper, re-derive portal projects/repository mappings, and reuse existing browser office session persistence. No filesystem, GitHub, runtime, agent, publish, merge, deploy, or validation command execution occurs in this runtime.

## Technical Context

**Language/Version**: TypeScript 5.8, Next.js 16, React 19, Phaser 3.90

**Primary Dependencies**: Existing `OfficeProjectPortalController`, `OfficeProjectPortalView`, `OfficeProjectPortalTypes`, `OfficeProjectPortalRegistry`, `BrowserOfficeSessionService`, `ProjectRegistryAdapters`, Vitest

**Storage**: Existing browser `localStorage` key `aiverse.office.session` through `BrowserOfficeSessionService`

**Testing**: Focused Vitest coverage added but ADOS validation runs outside this runtime

**Target Platform**: Browser-based AIverse app

**Project Type**: Single Next.js application

**Performance Goals**: Overlay navigation and identity application are synchronous over one draft row with no visible portal delay

**Constraints**: Mutate only the feature worktree. Do not run validation, start review, publish, merge, deploy, mutate GitHub, modify the primary repository, read the filesystem for repository verification, or start agent/runtime flows from this feature.

**Scale/Scope**: One external project draft; bounded repository identity choices; no free-form text entry, no live repository validation, no remote synchronization, no repository mutation

## Constitution Check

- Spec first: passed; `spec.md` and requirements checklist exist before code.
- Plan before code: passed; source and validation surfaces are identified before implementation.
- Tasks gate implementation: pending until `tasks.md` exists.
- Preserve application stability: passed; changes are scoped to Project Portal draft identity editing, rendering, and persistence.
- Validation required: documented below, but not executed in this ADOS runtime by handoff policy.

## Project Structure

### Documentation (this feature)

```text
specs/126-external-project-repository-identity-edit-overlay/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- repository-identity-edit-overlay.md
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
`-- OfficeProjectPortalView.ts
```

**Structure Decision**: Keep identity application in `OfficeProjectPortalRegistry.ts` because it owns draft registry derivation. Keep transient input orchestration in `OfficeProjectPortalController.ts` and rendering in `OfficeProjectPortalView.ts`.

## Validation

Focused validation, outside this runtime:

```powershell
npx vitest run src/features/city-view/scene/office/OfficeProjectPortalController.project-dashboard.test.ts src/features/city-view/scene/office/OfficeProjectPortalRegistry.test.ts src/features/city-view/scene/office/OfficeProjectPortalView.test.ts
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
