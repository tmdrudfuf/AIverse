# Implementation Plan: Trusted Local ADOS Execution Bridge

**Branch**: `codex/129-trusted-local-ados-execution-bridge` | **Date**: 2026-08-25 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/129-trusted-local-ados-execution-bridge/spec.md`

## Summary

Bridge the external project ADOS preparation record to a trusted local implementer execution attempt. The implementation adds a small external ADOS execution service/model/view helper, updates the preparation defaults to Spec 129 metadata, wires the Project Dashboard action sequence to start the bridge only after preparation exists, persists bridge state through browser session storage, and renders a compact dashboard row. The bridge starts only the implementer provider boundary and explicitly does not start validation, review, GitHub, publish, merge, deploy, or repository-side automation.

## Technical Context

**Language/Version**: TypeScript 5.8, Next.js 16, React 19, Phaser 3.90

**Primary Dependencies**: Existing `OfficeProjectPortalController`, `OfficeProjectPortalView`, `OfficeProjectPortalTypes`, `BrowserOfficeSessionService`, external ADOS run preparation helpers, `ClaudeImplementerRuntimeProvider`, Vitest

**Storage**: Existing browser `localStorage` key `aiverse.office.session` through `BrowserOfficeSessionService`

**Testing**: Focused Vitest coverage added but validation commands are not executed in this handoff runtime

**Target Platform**: Browser-based AIverse app with guarded local Node runtime provider support

**Project Type**: Single Next.js application

**Performance Goals**: Bridge validation and status rendering remain synchronous and scoped to one external project record

**Constraints**: Mutate only the feature worktree. Do not run validation, start review, publish, merge, deploy, mutate GitHub, modify the primary repository, or start any runtime from this handoff runtime. Runtime provider invocation is only application behavior behind explicit local dashboard action and provider-level spawn guards.

**Scale/Scope**: One external project development request draft, one ADOS run preparation, and one trusted local ADOS execution attempt per preparation; no validation, no review, no publish, no merge, no deploy, no GitHub mutation.

## Constitution Check

- Spec first: passed; `spec.md` and requirements checklist exist before code.
- Plan before code: passed; affected source and validation surfaces are identified before implementation.
- Tasks gate implementation: pending until `tasks.md` exists.
- Preserve application stability: passed; changes are scoped to external ADOS execution bridge state, rendering, and persistence.
- Validation required: documented below, but not executed in this runtime by handoff policy.

## Project Structure

### Documentation (this feature)

```text
specs/129-trusted-local-ados-execution-bridge/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- trusted-local-ados-execution.md
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
|-- OfficeProjectPortalView.test.ts
|-- OfficeProjectPortalController.testHelpers.ts
|-- browser-session/
|   |-- BrowserOfficeSessionService.ts
|   |-- BrowserOfficeSessionService.test.ts
|   `-- BrowserOfficeSessionTypes.ts
|-- external-ados-run-preparation/
|   |-- ExternalProjectAdosRunPreparationTypes.ts
|   |-- ExternalProjectAdosRunPreparationService.ts
|   `-- ExternalProjectAdosRunPreparationService.test.ts
`-- external-ados-execution/
    |-- ExternalProjectAdosExecutionTypes.ts
    |-- ExternalProjectAdosExecutionService.ts
    |-- ExternalProjectAdosExecutionService.test.ts
    |-- ExternalProjectAdosExecutionView.ts
    `-- ExternalProjectAdosExecutionView.test.ts
```

**Structure Decision**: Keep bridge logic in a new `external-ados-execution` module because it consumes preparation state but records a separate execution attempt. Keep dashboard orchestration in `OfficeProjectPortalController.ts`, rendering in `OfficeProjectPortalView.ts`, and persistence in the existing browser session service.

## Validation

Focused validation, outside this runtime:

```powershell
npx vitest run src/features/city-view/scene/office/external-ados-execution/ExternalProjectAdosExecutionService.test.ts src/features/city-view/scene/office/external-ados-execution/ExternalProjectAdosExecutionView.test.ts src/features/city-view/scene/office/OfficeProjectPortalController.project-dashboard.test.ts src/features/city-view/scene/office/OfficeProjectPortalView.test.ts src/features/city-view/scene/office/browser-session/BrowserOfficeSessionService.test.ts
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
