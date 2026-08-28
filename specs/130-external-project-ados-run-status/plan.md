# Implementation Plan: External Project ADOS Run Status

**Branch**: `codex/130-external-project-ados-run-status` | **Date**: 2026-08-25 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/130-external-project-ados-run-status/spec.md`

## Summary

Add a read-only external ADOS run status surface on top of existing preparation and execution bridge state. The implementation introduces a small status model/view helper, stores optional status summaries in browser office session state, derives visible dashboard status from the latest preparation/execution evidence, and renders a compact `[ADOS STATUS]` row without starting validation, review, repository mutation, GitHub mutation, publish, merge, deploy, or another implementer run.

## Technical Context

**Language/Version**: TypeScript 5.8, Next.js 16, React 19, Phaser 3.90

**Primary Dependencies**: Existing `OfficeProjectPortalController`, `OfficeProjectPortalView`, `OfficeProjectPortalTypes`, `BrowserOfficeSessionService`, external ADOS preparation/execution helpers, Vitest

**Storage**: Existing browser `localStorage` key `aiverse.office.session` through `BrowserOfficeSessionService`

**Testing**: Focused Vitest coverage added but validation commands are not executed in this handoff runtime

**Target Platform**: Browser-based AIverse app

**Project Type**: Single Next.js application

**Performance Goals**: Status derivation is synchronous and scoped to one external project record

**Constraints**: Mutate only the feature worktree. Do not run validation, start review, publish, merge, deploy, mutate GitHub, modify the primary repository, or start any runtime from this handoff runtime. Status rendering is read-only.

**Scale/Scope**: One current external ADOS status summary per external project; no new execution, validation, review, publish, merge, deploy, GitHub, or repository mutation behavior.

## Constitution Check

- Spec first: passed; `spec.md` and requirements checklist exist before code.
- Plan before code: passed; affected source and validation surfaces are identified before implementation.
- Tasks gate implementation: pending until `tasks.md` exists.
- Preserve application stability: passed; changes are scoped to external ADOS status state, rendering, and persistence.
- Validation required: documented below, but not executed in this runtime by handoff policy.

## Project Structure

### Documentation (this feature)

```text
specs/130-external-project-ados-run-status/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- external-project-ados-run-status.md
|-- checklists/
|   `-- requirements.md
`-- tasks.md
```

### Source Code

```text
src/features/city-view/scene/office/
|-- OfficeProjectPortalTypes.ts
|-- OfficeProjectPortalRegistry.ts
|-- OfficeProjectPortalView.ts
|-- OfficeProjectPortalView.test.ts
|-- browser-session/
|   |-- BrowserOfficeSessionService.ts
|   |-- BrowserOfficeSessionService.test.ts
|   `-- BrowserOfficeSessionTypes.ts
`-- external-ados-run-status/
    |-- ExternalProjectAdosRunStatusTypes.ts
    |-- ExternalProjectAdosRunStatusService.ts
    |-- ExternalProjectAdosRunStatusService.test.ts
    |-- ExternalProjectAdosRunStatusView.ts
    `-- ExternalProjectAdosRunStatusView.test.ts
```

**Structure Decision**: Keep status logic in a new `external-ados-run-status` module because it consumes preparation and execution bridge state but remains a separate read-only dashboard surface.

## Validation

Focused validation, outside this runtime:

```powershell
npx vitest run src/features/city-view/scene/office/external-ados-run-status/ExternalProjectAdosRunStatusService.test.ts src/features/city-view/scene/office/external-ados-run-status/ExternalProjectAdosRunStatusView.test.ts src/features/city-view/scene/office/OfficeProjectPortalView.test.ts src/features/city-view/scene/office/browser-session/BrowserOfficeSessionService.test.ts
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
