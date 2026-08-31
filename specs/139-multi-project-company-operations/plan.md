# Implementation Plan: Multi-Project Company Operations

**Branch**: `codex/139-multi-project-company-operations` | **Date**: 2026-08-31 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/139-multi-project-company-operations/spec.md`

## Summary

Project the existing project-scoped office ADOS state into the city scene so each registered/bound company displays its own operational status. Reuse ProjectRegistryService, ProjectCompanyBindingService, BrowserOfficeSessionService, persisted ADOS run statuses, city building rendering, and world-state synchronization. Do not add another registry, workflow engine, or global latest-run fallback.

## Technical Context

**Language/Version**: TypeScript, React/Next.js, Phaser

**Primary Dependencies**: Existing city scene building layer, world-state synchronizer, ProjectRegistryService, ProjectCompanyBindingService, BrowserOfficeSessionService, external ADOS status records, and Spec 136 live office visualization.

**Storage**: Existing browser office session persistence keyed by canonical project id.

**Testing**: Vitest targeted tests; ADOS will run the full configured validation pipeline outside this runtime.

**Target Platform**: Browser application with Phaser city and rendered office runtime.

**Project Type**: Web application with Phaser scene runtime.

**Performance Goals**: City status projection remains synchronous during scene creation and world-state synchronization.

**Constraints**: Mutate only the feature worktree; do not run the full ADOS validation pipeline here; do not start review, publish, merge, deploy, or mutate GitHub; no fake progress percentages or timer-based workflows.

**Scale/Scope**: Multiple registered/bound city companies with independent persisted project-scoped ADOS statuses and request/run records.

## Constitution Check

- Spec First: PASS. `spec.md` captures user value, scenarios, requirements, edge cases, and success criteria.
- Plan Before Code: PASS. This plan identifies the city status projection and affected architecture.
- Tasks Gate Implementation: PASS after `tasks.md` is created before application code changes.
- Preserve Application Stability: PASS. Changes are scoped to existing city/status/session/binding modules and focused tests.
- Validation Is Required: PASS. Targeted tests and diff checks will be run here; ADOS will run authoritative validation.

## Project Structure

### Documentation (this feature)

```text
specs/139-multi-project-company-operations/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- city-project-operations-status.md
|-- checklists/
|   `-- requirements.md
`-- tasks.md
```

### Source Code (repository root)

```text
src/features/city-view/scene/
|-- buildings/
|-- config/
|-- layers/
|-- office/
|   |-- browser-session/
|   |-- external-ados-run-status/
|   |-- external-development-requests/
|   |-- project-company-binding/
|   `-- project-registry/
`-- world-state/
```

**Structure Decision**: Add a city-level project operations status projection beside the city scene/layer code and feed it into rendering and world-state synchronization. Continue using existing office services for registry, binding, session, request, and run status identity.

## Complexity Tracking

No constitution violations.
