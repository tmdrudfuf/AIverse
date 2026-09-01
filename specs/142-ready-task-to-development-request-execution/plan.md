# Implementation Plan: Ready Task to Development Request Execution Bridge

**Branch**: `codex/142-ready-task-to-development-request-execution` | **Date**: 2026-08-31 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/142-ready-task-to-development-request-execution/spec.md`

## Summary

Add a task-scoped execution bridge that composes Spec 141 backlog selection with Spec 138 development request drafting, durable requirements artifact preparation, and trusted external ADOS execution. Persist project-scoped task/request/preparation/run associations in the existing backlog/session state, show a clear Start Development confirmation in the existing office backlog surface, and preserve strict explicit-execution and multi-project safety rules.

## Technical Context

**Language/Version**: TypeScript, React/Next.js, Phaser

**Primary Dependencies**: Existing ProjectBacklogService, ExternalProjectDevelopmentRequestService, ExternalProjectAdosRunPreparationService, ExternalProjectAdosExecutionService, ExternalProjectAdosRunStatusService, ProjectRegistryService, ProjectCompanyBindingService, BrowserOfficeSessionService, OfficeProjectPortalController/View, LiveAgentWorkVisualization, and PortfolioOperationsService.

**Storage**: Existing browser office session local storage snapshot keyed by canonical project id, existing durable external requirements artifact store path/content on development request drafts and ADOS preparations.

**Testing**: Focused Vitest unit/controller/view coverage plus documented runtime bridge evidence; ADOS will run the full configured validation pipeline outside this runtime.

**Target Platform**: Browser application with Phaser city/office runtime and local trusted ADOS implementer invocation.

**Project Type**: Web application with Phaser scene runtime.

**Performance Goals**: Bridge eligibility and association lookup remain synchronous and cheap for the small project/task collections displayed in the office and city.

**Constraints**: Mutate only this feature worktree; do not modify the primary repository; do not run the full configured ADOS validation pipeline here; do not start review, publish, merge, deploy, or mutate GitHub; do not add a second backlog store, project registry, ADOS executor, global task/run singleton, fake workflow simulation, or project-specific hack.

**Scale/Scope**: Multiple registered/bound project companies with independent backlog tasks, durable request/preparation/run associations, reload persistence, and concise read-only portfolio execution awareness.

## Constitution Check

- Spec First: PASS. `spec.md` captures user flows, acceptance criteria, edge cases, safety requirements, and measurable outcomes.
- Plan Before Code: PASS. This plan identifies existing services to extend and the technical constraints before implementation.
- Tasks Gate Implementation: PASS after `tasks.md` exists and is aligned before application code edits.
- Preserve Application Stability: PASS. Changes are scoped to backlog bridge types/service, existing request/preparation/execution composition, session persistence, office rendering, portfolio summary, and focused tests.
- Validation Is Required: PASS. Targeted tests and diff checks will be run as feasible here; the handoff explicitly defers full ADOS validation to ADOS.

## Project Structure

### Documentation (this feature)

```text
specs/142-ready-task-to-development-request-execution/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- runtime-verification.md
|-- contracts/
|   `-- backlog-development-bridge.md
|-- checklists/
|   `-- requirements.md
`-- tasks.md
```

### Source Code (repository root)

```text
src/features/city-view/scene/
|-- PortfolioOperationsService.ts
|-- PortfolioOperationsService.test.ts
`-- office/
    |-- OfficeProjectPortalController.ts
    |-- OfficeProjectPortalController.project-backlog-development.test.ts
    |-- OfficeProjectPortalView.ts
    |-- OfficeProjectPortalView.test.ts
    |-- OfficeProjectPortalTypes.ts
    |-- browser-session/
    |   |-- BrowserOfficeSessionService.ts
    |   |-- BrowserOfficeSessionService.test.ts
    |   `-- BrowserOfficeSessionTypes.ts
    |-- external-ados-execution/
    |   |-- ExternalProjectAdosExecutionService.ts
    |   `-- ExternalProjectAdosExecutionService.test.ts
    |-- external-ados-run-preparation/
    |   `-- ExternalProjectAdosRunPreparationService.ts
    |-- external-development-requests/
    |   |-- ExternalProjectDevelopmentRequestService.ts
    |   `-- ExternalProjectDevelopmentRequestTypes.ts
    `-- project-backlog/
        |-- ProjectBacklogDevelopmentBridgeService.ts
        |-- ProjectBacklogDevelopmentBridgeService.test.ts
        |-- ProjectBacklogService.ts
        |-- ProjectBacklogService.test.ts
        `-- ProjectBacklogTypes.ts
```

**Structure Decision**: Add a focused backlog development bridge service beside the existing backlog service and wire it through the existing office portal controller. Reuse the existing external development request draft, ADOS preparation, ADOS execution, ADOS status derivation, and browser session state rather than introducing new stores or execution mechanisms.

## Complexity Tracking

No constitution violations.
