# Implementation Plan: External Project Development Request Draft

**Branch**: `codex/127-external-project-development-request-draft` | **Date**: 2026-08-24 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/127-external-project-development-request-draft/spec.md`

## Summary

Add a local-only development request draft for the external project draft after repository identity has been configured. The implementation will add a small request draft state model, create/reuse it from the Project Dashboard action path, render a compact dashboard status row, and persist the record through the existing browser office session storage. The feature must not start repository sync, issue sync, validation, runtime, review, publish, merge, deploy, GitHub, or repository mutation flows.

## Technical Context

**Language/Version**: TypeScript 5.8, Next.js 16, React 19, Phaser 3.90

**Primary Dependencies**: Existing `OfficeProjectPortalController`, `OfficeProjectPortalView`, `OfficeProjectPortalTypes`, `BrowserOfficeSessionService`, `ProjectRegistryTypes`, Vitest

**Storage**: Existing browser `localStorage` key `aiverse.office.session` through `BrowserOfficeSessionService`

**Testing**: Focused Vitest coverage added but ADOS validation runs outside this runtime

**Target Platform**: Browser-based AIverse app

**Project Type**: Single Next.js application

**Performance Goals**: Draft creation and rendering are synchronous over one keyed record with no visible dashboard delay

**Constraints**: Mutate only the feature worktree. Do not run validation, start review, publish, merge, deploy, mutate GitHub, modify the primary repository, read the filesystem for repository verification, or start agent/runtime flows from this feature.

**Scale/Scope**: One external project draft and one idempotent development request draft per project; no free-form request editing, no task creation, no runtime execution, no repository sync, no validation

## Constitution Check

- Spec first: passed; `spec.md` and requirements checklist exist before code.
- Plan before code: passed; source and validation surfaces are identified before implementation.
- Tasks gate implementation: pending until `tasks.md` exists.
- Preserve application stability: passed; changes are scoped to Project Portal request draft state, rendering, and persistence.
- Validation required: documented below, but not executed in this ADOS runtime by handoff policy.

## Project Structure

### Documentation (this feature)

```text
specs/127-external-project-development-request-draft/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- development-request-draft.md
|-- checklists/
|   `-- requirements.md
`-- tasks.md
```

### Source Code

```text
src/features/city-view/scene/office/
|-- OfficeProjectPortalController.ts
|-- OfficeProjectPortalController.project-dashboard.test.ts
|-- OfficeProjectPortalTypes.ts
|-- OfficeProjectPortalView.ts
|-- browser-session/
|   |-- BrowserOfficeSessionService.ts
|   `-- BrowserOfficeSessionTypes.ts
`-- external-development-requests/
    |-- ExternalProjectDevelopmentRequestTypes.ts
    |-- ExternalProjectDevelopmentRequestService.ts
    |-- ExternalProjectDevelopmentRequestService.test.ts
    |-- ExternalProjectDevelopmentRequestView.ts
    `-- ExternalProjectDevelopmentRequestView.test.ts
```

**Structure Decision**: Keep request draft creation in a small external-development-requests service because the record is workflow state rather than project registry identity. Keep input orchestration in `OfficeProjectPortalController.ts`, dashboard summary rendering in `OfficeProjectPortalView.ts`, and persistence in the existing browser session service.

## Validation

Focused validation, outside this runtime:

```powershell
npx vitest run src/features/city-view/scene/office/OfficeProjectPortalController.project-dashboard.test.ts src/features/city-view/scene/office/external-development-requests/ExternalProjectDevelopmentRequestService.test.ts src/features/city-view/scene/office/external-development-requests/ExternalProjectDevelopmentRequestView.test.ts src/features/city-view/scene/office/browser-session/BrowserOfficeSessionService.test.ts
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
