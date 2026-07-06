# Implementation Plan: Project Advisory Signals

**Branch**: `034-project-advisory-signals`
**Date**: 2026-07-06
**Spec**: `specs/034-project-advisory-signals/spec.md`

**Input**: Feature specification from `specs/034-project-advisory-signals/spec.md`

## Summary

Expose existing local `ProjectManagementSuggestion` data in the Project Dashboard as compact read-only advisory signals. The implementation will add a provider-neutral advisory field to `ProjectDashboardSnapshot`, pass the existing portal state's suggestion map into the internal simulation Project Dashboard provider, render compact terminal rows in the existing Project Dashboard panel, and add focused tests proving empty-state, scoping, rendering, and read-only boundaries.

## Technical Context

**Language/Version**: TypeScript in the existing Next.js application
**Primary Dependencies**: Existing office Project Dashboard provider/view/controller, existing `AIProjectManagerService` suggestion types, Vitest
**Storage**: Existing in-memory portal state only; no new persistence
**Testing**: Vitest, TypeScript validation, production build
**Target Platform**: Browser-based AIverse office/city app
**Project Type**: Next.js app with Phaser office/city scenes and TypeScript read-model helpers
**Performance Goals**: Advisory derivation is synchronous, deterministic, local, and uses already-prepared suggestion data only
**Constraints**: Read-only only; no external AI calls; no GitHub API calls; no credentials; no sync; no task/employee/project mutation; no management controls; no new generic advisory framework
**Scale/Scope**: One focused PR adding Project Dashboard advisory read-model fields, view rows, controller/provider pass-through, and focused tests

## Constitution Check

- **Spec First**: `spec.md` exists and defines user stories, acceptance scenarios, edge cases, non-goals, and success criteria.
- **Plan Before Code**: This document defines the approach before production code changes.
- **Tasks Gate Implementation**: Implementation must wait until `tasks.md` exists and is aligned with this plan.
- **Preserve Application Stability**: Changes are scoped to Project Dashboard read-model derivation/rendering and tests; existing suggestion generation, Company Dashboard behavior, source signals, and simulation mutation flows are preserved.
- **Validation Is Required**: Implementation must run `npm test`, `npx tsc --noEmit`, `npm run build`, `git diff --check`, and `git diff --cached --check`.

No constitution violations are expected.

## Existing System Review

- `AIProjectManagerTypes.ts` already defines `ProjectManagementSuggestion` with health summary, risks, next action, and created timestamp.
- `AIProjectManagerService.ts` already creates deterministic local suggestions from project, task, employee, and activity inputs.
- `OfficeProjectPortalTypes.ts` already stores `projectManagementSuggestions` in portal state.
- `OfficeProjectPortalController.ts` already creates suggestions in existing project-management flows, but opening the Project Dashboard intentionally does not create suggestions.
- `ProjectDashboardTypes.ts` defines provider-neutral `ProjectDashboardSnapshot` data consumed by the Project Dashboard view.
- `InternalSimulationProjectDashboardProvider.ts` derives Project Dashboard snapshots from internal simulation context.
- `ProjectDashboardView.ts` creates compact row text for the terminal-style Project Dashboard panel.
- `OfficeProjectPortalView.ts` renders the Project Dashboard panel in the office computer portal.

## Architecture Approach

1. Add a small provider-neutral `ProjectDashboardAdvisorySignal` read model to `ProjectDashboardTypes.ts`.
2. Extend the internal Project Dashboard provider context with optional read-only `projectManagementSuggestions`.
3. Derive the selected project's advisory signal only from an existing matching suggestion.
4. Render an explicit empty/waiting state when no matching suggestion exists.
5. Pass the existing portal state's suggestion map into `createProjectDashboardContext()` without invoking suggestion generation.
6. Add compact Project Dashboard rows for advisory health, top risk/neutral risk, and next attention.
7. Keep the Phaser panel layout compact and readable without persistent instructions or management controls.

## Data Boundaries

- Project, task, employee, work-session, schedule, progression, company focus, repository mapping, and repository summary state remain authoritative in their existing systems.
- Advisory signals are derived view/read-model data only.
- Missing advisory data is represented as an empty state, not fabricated from unrelated dashboard fields.
- Project Dashboard rendering consumes provider-neutral snapshot data and does not import `AIProjectManagerService`, GitHub provider implementations, or external provider clients.

## Project Structure

### Documentation (this feature)

```text
specs/034-project-advisory-signals/
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- project-dashboard-advisory.md
|-- checklists/
|   `-- requirements.md
`-- tasks.md
```

### Source Code (repository root)

```text
src/features/city-view/scene/office/
|-- OfficeProjectPortalController.ts
|-- OfficeProjectPortalController.project-dashboard.test.ts
|-- OfficeProjectPortalView.ts
|-- ai/
|   |-- AIProjectManagerTypes.ts
|   `-- AIProjectManagerService.ts
`-- project-dashboard/
    |-- ProjectDashboardTypes.ts
    |-- InternalSimulationProjectDashboardProvider.ts
    |-- InternalSimulationProjectDashboardProvider.test.ts
    |-- ProjectDashboardView.ts
    `-- ProjectDashboardView.test.ts
```

**Structure Decision**: Extend existing office Project Dashboard files in place. Do not create a parallel advisory service or standalone framework because the current requirement is display-only and the existing snapshot/provider/view stack is already the right boundary.

## Risk Assessment

- **Hidden-data availability risk**: Project Dashboard may open before suggestions exist. Mitigation: render a clear empty/waiting state.
- **Mutation risk**: Passing suggestions into the provider could tempt generation during dashboard open. Mitigation: only pass the existing map and test that dashboard open/render does not create suggestions or mutate state.
- **Layout risk**: Advisory text could crowd the terminal panel. Mitigation: compact rows, truncation through existing row wrapping, and render tests for row presence/readability.
- **Scope creep risk**: Advisory could drift into management actions. Mitigation: no buttons/actions, no service calls, no external providers, no task/employee mutation.

## Validation

Implementation must run:

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```

Manual spot check, if visible dashboard text needs local confirmation:

1. Start the app with `npx next dev -p 3000`.
2. Open `http://localhost:3000`.
3. Enter Daily Proof Inc. and open the office computer/project portal.
4. Open Company Dashboard, select a project, and verify Project Dashboard advisory rows are compact and read-only.
5. Confirm projects without prepared advisory data show a waiting/unavailable advisory state.

## Post-Design Constitution Check

The planned design remains spec-first, read-only, provider-neutral, local-only, and scoped to the Project Dashboard read model and render path. No new framework, external service, credential flow, persistence layer, sync behavior, management control, task mutation, or employee-control path is introduced.
