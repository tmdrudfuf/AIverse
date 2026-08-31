# Implementation Plan: Operator Task Planning Project Backlog Foundation

**Branch**: `codex/141-operator-task-planning-project-backlog-foundation` | **Date**: 2026-08-31 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/141-operator-task-planning-project-backlog-foundation/spec.md`

## Summary

Add a canonical project-scoped backlog service, persisted browser session state, office planning UI, deterministic ordering, safe mutation checks, and compact read-only portfolio indicators. Reuse existing project registry, project/company binding, office project portal, browser session persistence, and portfolio aggregation patterns. Keep backlog tasks distinct from development requests and ADOS runtime state.

## Technical Context

**Language/Version**: TypeScript, React/Next.js, Phaser

**Primary Dependencies**: Existing ProjectRegistryService, ProjectCompanyBindingService, BrowserOfficeSessionService, OfficeProjectPortalController/View, and PortfolioOperationsService.

**Storage**: Existing browser office session local storage snapshot keyed by canonical project id.

**Testing**: Vitest targeted unit/integration coverage; ADOS will run the full configured validation pipeline outside this runtime.

**Target Platform**: Browser application with Phaser city scene and rendered project office runtime.

**Project Type**: Web application with Phaser scene runtime.

**Performance Goals**: Backlog derivation, ordering, and portfolio summaries remain synchronous and cheap for the small registered project set displayed in the city.

**Constraints**: Mutate only this feature worktree; do not run the full ADOS validation pipeline here; do not start review, publish, merge, deploy, or mutate GitHub; no fake progress, AI generation, autonomous reprioritization, ADOS execution, subprocess launch, second registry, or global backlog singleton.

**Scale/Scope**: Multiple registered and bound project companies with independent persisted backlog collections and read-only portfolio indicators.

## Constitution Check

- Spec First: PASS. `spec.md` captures user value, acceptance scenarios, requirements, edge cases, assumptions, and measurable criteria.
- Plan Before Code: PASS. This plan identifies the implementation approach, affected areas, validation strategy, and architectural fit.
- Tasks Gate Implementation: PASS after `tasks.md` exists and is aligned before application code edits.
- Preserve Application Stability: PASS. Changes are scoped to backlog models/services, browser session persistence, office portal UI, portfolio aggregation, and targeted tests.
- Validation Is Required: PASS. Targeted tests and diff checks will be run here; ADOS runs authoritative validation.

## Project Structure

### Documentation (this feature)

```text
specs/141-operator-task-planning-project-backlog-foundation/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- project-backlog-ui.md
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
    |-- CompanyOfficeScene.ts
    |-- OfficeProjectPortalController.ts
    |-- OfficeProjectPortalView.ts
    |-- OfficeProjectPortalTypes.ts
    |-- OfficeProjectPortalRegistry.ts
    |-- browser-session/
    |   |-- BrowserOfficeSessionService.ts
    |   |-- BrowserOfficeSessionService.test.ts
    |   `-- BrowserOfficeSessionTypes.ts
    `-- project-backlog/
        |-- ProjectBacklogTypes.ts
        |-- ProjectBacklogService.ts
        `-- ProjectBacklogService.test.ts
```

**Structure Decision**: Add a focused `project-backlog` service under office state ownership, persist its collections through the existing browser session service, render the planning surface through the existing project portal, and expose compact read-only summary counts through the existing portfolio aggregation service.

## Complexity Tracking

No constitution violations.
