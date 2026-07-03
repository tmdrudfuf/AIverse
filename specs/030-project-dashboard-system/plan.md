# Implementation Plan: Project Dashboard System

**Branch**: `codex/project-dashboard-system` | **Date**: 2026-07-03 | **Spec**: specs/030-project-dashboard-system/spec.md
**Input**: Feature specification from specs/030-project-dashboard-system/spec.md

## Summary

Add a read-only Project Dashboard that opens from the Company Dashboard for one selected project. The feature extends the dashboard/provider pattern with a project detail provider and snapshot derived from existing simulation data, while preserving a future GitHub mapping path without implementing GitHub integration.

## Technical Context

**Language/Version**: TypeScript with React/Next.js
**Primary Dependencies**: Existing AIverse app, Company Dashboard provider/UI, Company Influence state, Office Project Portal controller/view/state, Projects, Tasks, Employee AI, Schedule, Company Progression, work-session/activity, and simulation systems
**Storage**: Existing runtime state only; no new persistence
**Testing**: Existing project test tooling (`npm test`) plus TypeScript/build validation
**Target Platform**: Browser
**Project Type**: Web game/simulation
**Performance Goals**: Opening one project detail view should be immediate and should not block office simulation or movement
**Constraints**: Read-only first slice, no GitHub integration, no external provider calls, no task assignment/editing, no simulation mutation, no management controls, Phaser remains view-only
**Scale/Scope**: One selected project detail dashboard derived from internal simulation data, with future-ready provider-neutral contracts

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
specs/030-project-dashboard-system/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   |-- project-dashboard-provider.md
|   |-- project-dashboard-ui.md
|   `-- future-github-mapping.md
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
|               |-- project-dashboard/
|               |   |-- ProjectDashboardTypes.ts
|               |   |-- InternalSimulationProjectDashboardProvider.ts
|               |   |-- ProjectDashboardView.ts
|               |   `-- *.test.ts
|               |-- influence/
|               |   `-- CompanyInfluencePlanningTypes.ts
|               |-- OfficeProjectPortalController.ts
|               |-- OfficeProjectPortalTypes.ts
|               |-- OfficeProjectPortalView.ts
|               `-- OfficeProjectPortalController.*.test.ts
`-- ...
```

The `project-dashboard/` folder is expected only if inspection confirms a separate project detail module fits the existing office feature organization. If the existing dashboard folder already has the right extension point, the implementation should extend that folder instead and update this plan before code changes.

## Confirmed Reusable Sources

- `CompanyDashboardTypes`, `CompanyDashboardView`, provider registry, and `InternalSimulationDashboardProvider` already define provider-neutral dashboard aggregation.
- `CompanyInfluencePlanningTypes` and related dashboard summary data already represent advisory focus state without mutating simulation.
- `OfficeProjectPortalController`, `OfficeProjectPortalTypes`, and `OfficeProjectPortalView` already coordinate portal/dashboard navigation.
- Existing Projects, Tasks, Employee AI, Schedule, Company Progression, work-session/activity, NPC, Insight, Knowledge, and Conversation systems contain authoritative state that must be read but not duplicated or mutated.

## Implementation Strategy

1. Inspect current Company Dashboard, Company Influence, project/task data, Employee AI, Schedule, Progression, portal controller/view, and tests before editing.
2. Add provider-neutral Project Dashboard types for one selected project, project health, active work, employees, blockers, recent activity, advisory focus, and optional future source metadata.
3. Add an internal simulation project dashboard provider that derives snapshots from existing project/task/employee/progression/influence state.
4. Add portal/controller state for the selected project dashboard view without changing project/task execution.
5. Add Company Dashboard affordance to open a project detail view using existing project entries.
6. Add read-only Project Dashboard UI and tests for populated, empty, and unavailable states.
7. Add regression tests proving project inspection does not mutate projects, tasks, employee AI, schedules, company influence, work sessions, or progression.
8. Complete manual validation using quickstart.md.

## Data Boundaries

- Source-of-truth project/task/employee/schedule/progression/influence state remains in existing systems.
- Project Dashboard snapshots are derived read models, not new simulation state.
- Future external source metadata is optional descriptive metadata only.
- GitHub, issue creation, repository sync, credential flows, webhooks, management actions, and task editing are explicitly out of scope.

## Complexity Tracking

No constitution violations are planned. Any significant architectural change must document why existing Company Dashboard, project portal, or provider extension points were insufficient.

## Validation

Before implementation completion:

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```

Manual validation follows specs/030-project-dashboard-system/quickstart.md.
