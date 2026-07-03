# Implementation Plan: Company Influence Planning System

**Branch**: `codex/company-influence-planning-system` | **Date**: 2026-07-03 | **Spec**: specs/029-company-influence-planning-system/spec.md
**Input**: Feature specification from specs/029-company-influence-planning-system/spec.md

## Summary

Add a small Company Influence Planning layer on top of the Company Dashboard System. The player can choose one high-level company focus from the dashboard flow. The selected focus is deterministic, local, in-memory app state that appears on the dashboard and only affects advisory summaries, labels, and future-ready metadata in this phase.

## Technical Context

**Language/Version**: TypeScript with React/Next.js
**Primary Dependencies**: Existing AIverse app, Company Dashboard provider/UI, Office Project Portal controller/view/state, Employee AI, Schedule, Projects, Company Progression, Office Layout, work-session, NPC, and simulation systems
**Storage**: Existing in-memory/runtime app state only unless an existing local persistence pattern already covers the relevant portal state
**Testing**: Existing project test tooling (`npm test`) plus TypeScript/build validation
**Target Platform**: Browser
**Project Type**: Web game/simulation
**Performance Goals**: Focus selection updates dashboard state immediately without blocking office simulation
**Constraints**: Advisory-only influence, no direct employee/task/project mutation, no external AI/providers, no economy/payroll/dialogue/management systems, Phaser remains view-only
**Scale/Scope**: One local current focus with five fixed options, dashboard affordance, and regression coverage around no simulation mutation

## Constitution Check

- Spec Kit workflow is followed: spec, plan, tasks, implementation.
- Existing code must be inspected before editing.
- Smallest correct implementation is preferred.
- Existing architecture and coding style must be preserved.
- Existing systems must be reused before introducing new ones.
- No application code changes occur until spec, plan, and tasks are aligned.
- Full validation must pass before implementation completion.

## Project Structure

### Documentation

```text
specs/029-company-influence-planning-system/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   |-- company-influence-planning-service.md
|   `-- dashboard-influence-integration.md
`-- checklists/
    `-- requirements.md
```

### Expected Source Touchpoints

```text
src/
|-- features/
|   `-- city-view/
|       `-- scene/
|           `-- office/
|               |-- dashboard/
|               |   |-- CompanyDashboardTypes.ts
|               |   |-- CompanyDashboardView.ts
|               |   |-- InternalSimulationDashboardProvider.ts
|               |   `-- *.test.ts
|               |-- influence/
|               |   |-- CompanyInfluencePlanningTypes.ts
|               |   |-- CompanyInfluencePlanningService.ts
|               |   `-- CompanyInfluencePlanningService.test.ts
|               |-- OfficeProjectPortalController.ts
|               |-- OfficeProjectPortalTypes.ts
|               |-- OfficeProjectPortalView.ts
|               `-- OfficeProjectPortalController.*.test.ts
`-- ...
```

The `influence/` folder is only expected if inspection confirms a separate small domain folder fits existing office feature organization. Otherwise, the implementation should use the nearest existing dashboard/portal organization and document the choice in this plan.

## Confirmed Reusable Sources

- `CompanyDashboardTypes`, `CompanyDashboardView`, provider registry, and `InternalSimulationDashboardProvider` already define a provider-neutral dashboard foundation.
- `OfficeProjectPortalController`, `OfficeProjectPortalTypes`, and `OfficeProjectPortalView` already coordinate portal state, dashboard navigation, and project portal presentation.
- Employee AI, schedule, project task, work-session, progression, layout, NPC, insight, knowledge, and conversation systems already contain simulation state that must remain authoritative and unmutated by this feature.

## Implementation Strategy

1. Inspect current dashboard, provider, portal controller, portal view, portal state, and tests before editing.
2. Add a small influence planning domain type/service for five fixed focus options, initial local state, deterministic selection, and dashboard-ready focus summary.
3. Add local portal/controller state and minimally mutating methods to get and set the current company focus.
4. Surface current focus through dashboard/provider-neutral data without duplicating employee/project simulation state.
5. Add dashboard UI affordance to view/select current focus using existing portal/dashboard interaction patterns.
6. Add tests for option definitions, deterministic selection, dashboard display, idempotent selection, and no direct mutation of employee/task/project/schedule/work-session/NPC state.
7. Complete manual validation using quickstart.md.

## Data Boundaries

- Source-of-truth simulation state remains in existing Employee AI, Schedule, Projects, Company Progression, Office Layout, work-session, NPC, and conversation systems.
- Company influence state is local player-selected planning metadata, not simulation execution state.
- Dashboard focus summary may be rendered in the dashboard, but it must not become duplicated employee or project state.
- Future providers, dialogue, memory, management, economy, multiplayer, and save/load integrations are not implemented in this feature.

## Complexity Tracking

No constitution violations are planned. Any significant architectural change must document why dashboard/portal extension points were insufficient.

## Validation

Before implementation completion:

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```

Manual validation follows specs/029-company-influence-planning-system/quickstart.md.
