# Implementation Plan: Company Dashboard System

**Branch**: `028-company-dashboard-system` | **Date**: 2026-07-03 | **Spec**: specs/028-company-dashboard-system/spec.md
**Input**: Feature specification from specs/028-company-dashboard-system/spec.md

## Summary

Create a read-only Company Dashboard that acts as the AIverse company command center. The dashboard will consume provider-neutral snapshots from a dashboard provider abstraction. The first vertical slice implements only the Internal Simulation provider, deriving company health, employee, project, workload, occupancy, bottleneck, activity, conversation, productivity, risk, and summary sections from existing systems where available.

## Technical Context

**Language/Version**: TypeScript with React/Next.js
**Primary Dependencies**: Existing AIverse app, Employee AI, Schedule, Projects, Company Progression, Office Layout, Conversation, Employee Insight, Employee Knowledge, work-session/activity systems
**Storage**: Existing in-memory/runtime simulation state only; no new persistence
**Testing**: Existing project test tooling (`npm test`) plus TypeScript/build validation
**Target Platform**: Browser
**Project Type**: Web game/simulation
**Performance Goals**: Dashboard opens responsively and recomputes derived snapshots without blocking office simulation
**Constraints**: Read-only MVP, no duplicate simulation state, no external connectors, provider-neutral UI
**Scale/Scope**: Single internal simulation provider and dashboard UI foundation suitable for future providers

## Constitution Check

- Spec Kit workflow is followed: spec, plan, tasks, implementation.
- Existing code must be inspected before editing.
- Smallest correct implementation is preferred.
- Existing architecture and coding style must be preserved.
- Existing systems must be reused before introducing new ones.
- One commit should be created per completed phase.
- Full validation must pass before each phase commit.

## Project Structure

### Documentation

```text
specs/028-company-dashboard-system/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   |-- company-dashboard-provider.md
|   `-- company-dashboard-ui.md
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
|               |-- employees/
|               |-- schedules/
|               |-- tasks/
|               |-- work-sessions/
|               |-- workstations/
|               |-- conversations/
|               |-- insight/
|               |-- knowledge/
|               |-- progression/
|               |-- layout/
|               |-- OfficeProjectPortalController.ts
|               |-- OfficeProjectPortalTypes.ts
|               `-- OfficeProjectPortalView.ts
`-- ...
```

Phase 1 inspection confirmed that the current simulation and portal architecture is centered under `src/features/city-view/scene/office/`. The dashboard should extend that office feature area rather than introduce a parallel top-level dashboard system.

## Confirmed Reusable Sources

- `OfficeProjectPortalController` already coordinates projects, tasks, employees, work sessions, employee simulation, NPC movement, workstations, schedules, conversations, company progression, and office layout.
- `OfficeProjectPortalState` already holds loaded project, task, employee, employee simulation, assignment, and work-session records used by the existing portal.
- `EmployeeInsightSource` and `EmployeeKnowledgeSource` already demonstrate read-only derived context over existing employee, AI, schedule, project, workstation, progression, conversation, and activity data.
- `CompanyProgressionService` and `OfficeLayoutService` already expose company stage, capacity, unlocked zones, layout, and occupancy-adjacent inputs.
- Dashboard implementation should add provider-neutral dashboard read models under `src/features/city-view/scene/office/dashboard/` and derive the Internal Simulation provider snapshot from existing office controller/service data.

## Implementation Strategy

1. Inspect existing Employee AI, schedule, project, progression, office layout, conversation, insight, knowledge, and portal/dashboard-adjacent code.
2. Add provider-neutral dashboard types and provider contract under `src/features/city-view/scene/office/dashboard/` in the existing office feature organization style.
3. Implement the Internal Simulation provider as a read-only aggregator over existing systems.
4. Add a lightweight dashboard service/controller only if it fits existing architecture and avoids parallel state.
5. Add read-only dashboard UI that consumes provider-neutral snapshots.
6. Integrate the dashboard into an existing company/office surface without adding management behavior.
7. Add tests for provider derivation, empty states, UI read-only behavior, and provider abstraction boundaries.
8. Complete manual validation using quickstart.md.

## Provider Architecture

```text
Company Dashboard UI
        |
        v
CompanyDashboardSnapshot
        |
        v
CompanyDashboardProvider
        |
        v
InternalSimulationDashboardProvider

Future providers:
GitHub, Firebase, Notion, Jira, Linear, Figma
```

Only `InternalSimulationDashboardProvider` is implemented in this feature.

## Data Sources

The Internal Simulation provider should reuse existing data where available:

- Employee AI for employee state, current task, mood, and focus
- Schedule for current and upcoming work context
- Projects and Company Progression for project state and company health
- Office Layout and NPC/employee location for occupancy
- Conversation for recent conversation summaries
- Employee Insight and Employee Knowledge for derived employee context where appropriate
- Work-session and activity logs for recent company activity and productivity

## Complexity Tracking

No constitution violations are planned. Any significant architectural change must document why existing systems were insufficient.

## Validation

Before every phase commit:

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```

Manual validation follows specs/028-company-dashboard-system/quickstart.md.
