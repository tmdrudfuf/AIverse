# Implementation Plan: Real Project Company Binding

**Branch**: `codex/137-real-project-company-binding` | **Date**: 2026-08-29 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/137-real-project-company-binding/spec.md`

## Summary

Bind city project companies to registered projects through a focused project-company binding/context layer. Reuse the existing project registry, browser session persistence, office scene, project dashboard, ADOS run status, and Spec 136 live visualization. The selected company supplies the active project id; downstream consumers stop relying on default/global project selection.

## Technical Context

**Language/Version**: TypeScript, React/Next.js, Phaser

**Primary Dependencies**: Existing AIverse city-view, project registry, browser session, dashboard, ADOS runtime services

**Storage**: Existing browser office session persistence and project registry state

**Testing**: Existing npm/Vitest-style TypeScript tests plus home canvas e2e outside this runtime

**Target Platform**: Browser application

**Project Type**: Web application with Phaser scene runtime

**Performance Goals**: Binding resolution should be synchronous and occur within the existing scene/portal render cycle.

**Constraints**: Do not redesign the office, do not add a second registry, do not run the full ADOS validation pipeline in this runtime, do not mutate the primary repository.

**Scale/Scope**: Focused city company to project binding and office/portal/status/live visualization context propagation.

## Constitution Check

- Spec First: PASS. `spec.md` exists and captures user value, scenarios, requirements, edge cases, and success criteria.
- Plan Before Code: PASS. This plan identifies affected architecture and validation.
- Tasks Gate Implementation: PASS after `tasks.md` is created before code changes.
- Preserve Application Stability: PASS. Changes are scoped to city building metadata, office spawn/context, portal state initialization, binding service, persistence, and focused tests.
- Validation Is Required: PASS. Targeted tests will run here; ADOS will run the full configured pipeline after handoff.

## Project Structure

### Documentation (this feature)

```text
specs/137-real-project-company-binding/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- project-company-binding.md
|-- checklists/
|   `-- requirements.md
`-- tasks.md
```

### Source Code (repository root)

```text
src/features/city-view/scene/
|-- buildings/
|   |-- buildingTypes.ts
|   `-- BuildingTransitionController.ts
|-- config/
|   `-- cityBuildingConfig.ts
`-- office/
    |-- CompanyOfficeScene.ts
    |-- OfficeSpawnManager.ts
    |-- officeTypes.ts
    |-- OfficeProjectPortalController.ts
    |-- OfficeProjectPortalRegistry.ts
    |-- browser-session/
    `-- project-company-binding/
```

**Structure Decision**: Add a small binding module under the office domain because it resolves office project context from city company selection and existing project registry entries.

## Complexity Tracking

No constitution violations.
