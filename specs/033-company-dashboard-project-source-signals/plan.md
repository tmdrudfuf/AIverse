# Implementation Plan: Company Dashboard Project Source Signals

**Branch**: `033-company-dashboard-project-source-signals`
**Spec**: `specs/033-company-dashboard-project-source-signals/spec.md`

## Summary

Add compact read-only source signal metadata to Company Dashboard project summaries so each visible project can show whether it is internal-only or linked to an external source such as GitHub. The first slice reuses existing GitHub repository mapping and source-status concepts from Spec 031, but does not call GitHub APIs, refresh data, store credentials, sync repositories, or mutate any simulation or repository state.

## Technical Context

**Language/Version**: TypeScript in the existing Next.js application
**Primary Dependencies**: Existing Company Dashboard provider/view/tests, GitHub repository mapping/status types from `src/features/city-view/scene/office/github/`, Project Dashboard source metadata concepts
**Storage**: Existing in-memory app state only; no new persistence
**Testing**: Vitest, TypeScript validation, production build
**Target Platform**: Browser-based AIverse office/city app
**Project Type**: Next.js app with Phaser office/city scenes and React-style read-model helpers
**Performance Goals**: Source signal derivation should be deterministic and local, with no network or async work
**Constraints**: Read-only only; no GitHub API calls; no credentials; no repository sync; no repository mutation; preserve provider-neutral dashboard boundaries
**Scale/Scope**: One small PR adding project-row source signal metadata, derivation, rendering text, and focused tests

## Constitution Check

- **Spec First**: This plan follows `spec.md` for user value, acceptance scenarios, edge cases, and success criteria.
- **Plan Before Code**: This document defines the intended technical approach before implementation.
- **Tasks Gate Implementation**: Implementation must wait until `tasks.md` is complete and aligned.
- **Preserve Application Stability**: Changes are scoped to Company Dashboard read models, derivation, view rows, and tests; no simulation behavior should change.
- **Validation Is Required**: Implementation must run `npm test`, `npx tsc --noEmit`, `npm run build`, `git diff --check`, and `git diff --cached --check`.

No constitution violations are expected.

## Existing System Review

- `CompanyDashboardTypes.ts` currently defines `CompanyDashboardProjectItem` without source signal metadata.
- `InternalSimulationDashboardProvider.ts` currently derives project summaries from existing projects and tasks only.
- `CompanyDashboardView.ts` currently renders aggregate project counts/progress but not per-project source context.
- Spec 031 provides reusable `AIverseProjectRepositoryMapping`, `GitHubRepositorySummary`, and external source status helpers.
- `GitHubProjectDashboardProvider.ts` already maps repository source status into provider-neutral Project Dashboard source metadata, but this feature should not duplicate full Project Dashboard logic.

## Architecture Approach

1. Extend the Company Dashboard project read model with compact optional source signal metadata per project.
2. Add read-only context inputs for repository mappings and repository summaries to the internal dashboard provider.
3. Derive each project signal locally:
   - No mapping: Internal.
   - Valid mapping with summary/status: GitHub plus display-safe status.
   - Invalid, disabled, private, missing, stale, rate-limited, offline, or unknown source: display-safe status from existing source-status helpers.
4. Render a compact deterministic source row/summary in the Company Dashboard view helper.
5. Add focused provider and view tests for internal-only, GitHub-linked, unavailable/stale states, and read-only boundaries.

## Data Boundaries

- Internal simulation remains authoritative for company, project, task, employee, schedule, work-session, progression, insight, and knowledge state.
- GitHub mapping data owns only project-to-repository association metadata.
- GitHub repository summary data owns only read-only repository status and summary metadata when already available.
- Company Dashboard source signals are derived read-model metadata, not new simulation state.

## File Touchpoints

Likely implementation files:

- `src/features/city-view/scene/office/dashboard/CompanyDashboardTypes.ts`
- `src/features/city-view/scene/office/dashboard/InternalSimulationDashboardProvider.ts`
- `src/features/city-view/scene/office/dashboard/CompanyDashboardView.ts`
- `src/features/city-view/scene/office/dashboard/InternalSimulationDashboardProvider.test.ts`
- `src/features/city-view/scene/office/dashboard/CompanyDashboardView.test.ts`

Possible integration file if the existing portal controller does not already pass mapping/summary inputs to the Company Dashboard provider:

- `src/features/city-view/scene/office/OfficeProjectPortalController.ts`

## Risk Assessment

- **UI density risk**: Adding per-project source details could crowd the compact terminal dashboard. Mitigation: render only a short aggregate or first few project source rows.
- **Coupling risk**: Dashboard view could accidentally import GitHub provider implementation. Mitigation: render provider-neutral dashboard fields only.
- **Duplication risk**: Full Project Dashboard source metadata could be duplicated. Mitigation: derive only compact source labels/statuses needed for company-level observation.
- **Security risk**: GitHub status rendering could drift into auth or refresh behavior. Mitigation: no network calls, credentials, token fields, or sync paths in scope.

## Validation

Implementation must run:

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```

Manual spot check, if implementation affects visible dashboard text:

1. Start the app.
2. Open `http://localhost:3000`.
3. Enter the office and open the computer/project portal.
4. Open Company Dashboard.
5. Verify project source signals are readable and no repository mutation controls appear.

## Post-Design Constitution Check

The planned design remains spec-first, read-only, provider-neutral, and scoped to dashboard read-model derivation. No new framework, external service, credential flow, persistence layer, or repository mutation path is introduced.
