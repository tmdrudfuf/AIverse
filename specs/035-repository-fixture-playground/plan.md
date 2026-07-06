# Implementation Plan: Repository Fixture Playground

**Branch**: `035-repository-fixture-playground` | **Date**: 2026-07-07 | **Spec**: `specs/035-repository-fixture-playground/spec.md`

**Input**: Feature specification from `specs/035-repository-fixture-playground/spec.md`

## Summary

Enhance the existing local mock GitHub repository data so the Company Dashboard and Project Dashboard can exercise realistic, deterministic, GitHub-like source states before any real GitHub API work exists. The implementation will keep the current provider-neutral dashboard flow, enrich local fixture summaries for mapped projects, preserve unavailable behavior for unknown projects, and add tests proving fresh/stale/failing/unavailable scenarios, read-only behavior, and no external call path.

## Technical Context

**Language/Version**: TypeScript with Next.js/React/Phaser application code

**Primary Dependencies**: Existing Next.js app, Phaser office portal scene, Vitest tests, local office dashboard/provider modules

**Storage**: In-memory session state only; local deterministic fixture constants; no persistence/save-load

**Testing**: Vitest through `npm test`, TypeScript via `npx tsc --noEmit`, production build via `npm run build`

**Target Platform**: Browser-based AIverse office simulation running in the existing Next.js application

**Project Type**: Web application with Phaser scene/UI modules and TypeScript domain services

**Performance Goals**: Fixture lookup remains synchronous/constant-time for the small local dataset; dashboard rendering remains compact and deterministic

**Constraints**: Local/mock only; read-only; no real GitHub API; no external network; no credentials/auth; no sync; no repository/task/project/employee/advisory mutation; no dashboard redesign; no fixture selector UI

**Scale/Scope**: One focused PR enriching the existing mock GitHub provider data and adding tests across provider-neutral dashboard consumption

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Spec First**: PASS. `specs/035-repository-fixture-playground/spec.md` exists and defines user stories, requirements, non-goals, and success criteria.
- **Plan Before Code**: PASS. This plan documents the technical approach and validation before application code changes.
- **Tasks Gate Implementation**: PASS. Implementation will start only after `tasks.md` exists.
- **Preserve Application Stability**: PASS. Scope is limited to the active feature files and existing GitHub/dashboard provider tests; pre-existing `next-env.d.ts` changes will remain untouched.
- **Validation Is Required**: PASS. The plan requires `npm test`, `npx tsc --noEmit`, `npm run build`, `git diff --check`, and `git diff --cached --check`.

## Project Structure

### Documentation (this feature)

```text
specs/035-repository-fixture-playground/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- repository-fixtures.md
|-- checklists/
|   `-- requirements.md
`-- tasks.md
```

### Source Code (repository root)

```text
src/features/city-view/scene/office/
|-- github/
|   |-- GitHubRepositoryTypes.ts
|   |-- GitHubRepositoryTypes.test.ts
|   |-- MockGitHubRepositoryProvider.ts
|   `-- MockGitHubRepositoryProvider.test.ts
|-- dashboard/
|   `-- InternalSimulationDashboardProvider.test.ts
|-- project-dashboard/
|   `-- GitHubProjectDashboardProvider.test.ts
`-- OfficeProjectPortalController.project-dashboard.test.ts
```

**Structure Decision**: Extend the existing office GitHub mock/provider and dashboard tests in place. Do not create a new fixture selector, playground screen, provider framework, persistence layer, or external integration module.

## Complexity Tracking

No constitution violations or extra complexity are required.

## Phase 0 Research

See `specs/035-repository-fixture-playground/research.md`.

## Phase 1 Design

See:

- `specs/035-repository-fixture-playground/data-model.md`
- `specs/035-repository-fixture-playground/contracts/repository-fixtures.md`
- `specs/035-repository-fixture-playground/quickstart.md`

## Post-Design Constitution Check

- **Spec First**: PASS. Design artifacts stay aligned with the specification.
- **Plan Before Code**: PASS. Plan identifies affected modules and validation.
- **Tasks Gate Implementation**: PASS. Tasks will be generated before code edits.
- **Preserve Application Stability**: PASS. Design reuses existing provider-neutral paths and avoids unrelated files.
- **Validation Is Required**: PASS. Automated validation and focused tests are defined.
