# Implementation Plan: Project Portfolio Operations

**Branch**: `codex/140-project-portfolio-operations` | **Date**: 2026-08-31 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/140-project-portfolio-operations/spec.md`

## Summary

Project existing Spec 139 project-scoped office state into an operator-facing portfolio operations model for the city. Add deterministic portfolio summaries, attention-state mapping, non-mutating filtering, compact city visual treatment, and selection/re-entry summaries while reusing ProjectRegistryService, ProjectCompanyBindingService, BrowserOfficeSessionService, persisted development request state, ADOS run state, and LiveAgentWorkVisualization.

## Technical Context

**Language/Version**: TypeScript, React/Next.js, Phaser

**Primary Dependencies**: Existing city building system, CityProjectOperationsStatusService, ProjectRegistryService, ProjectCompanyBindingService, BrowserOfficeSessionService, external ADOS state services, persisted development request drafts, and LiveAgentWorkVisualization.

**Storage**: Existing browser office session persistence keyed by canonical project id. No new workflow store.

**Testing**: Vitest targeted unit/integration coverage; ADOS will run the full configured validation pipeline outside this runtime.

**Target Platform**: Browser application with Phaser city scene and rendered project office runtime.

**Project Type**: Web application with Phaser scene runtime.

**Performance Goals**: Portfolio aggregation is synchronous and cheap for the small registered company set rendered in the city.

**Constraints**: Mutate only this feature worktree; do not run the full ADOS validation pipeline here; do not start review, publish, merge, deploy, or mutate GitHub; no fake progress, timer simulation, autonomous work, second registry, or global latest-run fallback.

**Scale/Scope**: Multiple registered and bound project companies with independent persisted request/run/blocker/completion state.

## Constitution Check

- Spec First: PASS. `spec.md` captures user value, acceptance scenarios, requirements, edge cases, assumptions, and measurable criteria.
- Plan Before Code: PASS. This plan identifies the implementation approach, affected areas, validation strategy, and architectural fit.
- Tasks Gate Implementation: PASS after `tasks.md` exists and is aligned before application code edits.
- Preserve Application Stability: PASS. Changes are scoped to existing city/status/session/binding modules and targeted tests.
- Validation Is Required: PASS. Targeted tests and diff checks will be run here; ADOS runs authoritative validation.

## Project Structure

### Documentation (this feature)

```text
specs/140-project-portfolio-operations/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- portfolio-operations-city.md
|-- checklists/
|   `-- requirements.md
`-- tasks.md
```

### Source Code (repository root)

```text
src/features/city-view/scene/
|-- PortfolioOperationsService.ts
|-- PortfolioOperationsService.test.ts
|-- CityProjectOperationsStatusService.ts
|-- CityProjectOperationsStatusService.test.ts
|-- buildings/
|   |-- BuildingInteractionPrompt.ts
|   |-- BuildingInteractionPrompt.test.ts
|   `-- BuildingTransitionController.ts
|-- layers/
|   |-- CityBuildingLayer.ts
|   `-- CityBuildingLayer.test.ts
|-- office/
|   |-- browser-session/
|   |-- external-ados-run-status/
|   |-- external-development-requests/
|   |-- project-company-binding/
|   `-- project-registry/
`-- world-state/
```

**Structure Decision**: Add a focused portfolio aggregation service beside the city scene and adapt existing city status rendering to consume its operator-facing summaries. Keep office project selection and ADOS state owned by existing project-scoped services.

## Complexity Tracking

No constitution violations.
