# Implementation Plan: GitHub Read Integration Preflight

**Branch**: `036-github-read-integration-preflight` | **Date**: 2026-07-07 | **Spec**: `specs/036-github-read-integration-preflight/spec.md`

**Input**: Feature specification from `specs/036-github-read-integration-preflight/spec.md`

## Summary

Define and lightly enforce the future public read-only GitHub integration boundary before any real network/API behavior exists. The implementation will add contract documentation, encode the approved first-read repository summary field list in the existing GitHub types module, and add focused Vitest coverage for provider interchangeability, summary-level mapping, display-safe error states, and no network/auth/sync/mutation behavior. No real provider, `fetch`, credentials, sync, persistence, UI, or dashboard redesign will be added.

## Technical Context

**Language/Version**: TypeScript with Next.js/React/Phaser application code

**Primary Dependencies**: Existing office GitHub repository types/provider service, Company Dashboard source signal provider, Project Dashboard source metadata provider, Vitest

**Storage**: N/A; no persistence or save/load; existing in-memory repository summary state remains the only runtime cache

**Testing**: Vitest through `npm test`, TypeScript via `npx tsc --noEmit`, production build via `npm run build`

**Target Platform**: Browser-based AIverse office simulation in the existing Next.js app

**Project Type**: Web application with Phaser scene/UI modules and TypeScript domain services

**Performance Goals**: No runtime performance impact beyond static metadata exports and tests

**Constraints**: No real GitHub API; no `fetch`; no external network; no credentials/auth/token handling; no sync; no repository/task/project/employee/advisory mutation; no persistence; no repository URL UI; no dashboard redesign; no broad provider framework

**Scale/Scope**: One focused PR containing Spec Kit artifacts plus minimal non-network type/test guardrails

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Spec First**: PASS. `specs/036-github-read-integration-preflight/spec.md` exists and defines preflight boundaries, requirements, non-goals, and success criteria.
- **Plan Before Code**: PASS. This plan documents the technical approach and validation before code changes.
- **Tasks Gate Implementation**: PASS. Implementation starts only after `tasks.md` exists.
- **Preserve Application Stability**: PASS. Scope is limited to GitHub repository type/service tests and Spec Kit artifacts. No app behavior or UI flow changes are planned.
- **Validation Is Required**: PASS. Full validation commands are required before completion.

## Project Structure

### Documentation (this feature)

```text
specs/036-github-read-integration-preflight/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- github-read-boundary.md
|-- checklists/
|   `-- requirements.md
`-- tasks.md
```

### Source Code (repository root)

```text
src/features/city-view/scene/office/github/
|-- GitHubRepositoryTypes.ts
|-- GitHubRepositoryTypes.test.ts
|-- GitHubRepositoryService.ts
|-- GitHubRepositoryService.test.ts
|-- MockGitHubRepositoryProvider.ts
`-- MockGitHubRepositoryProvider.test.ts

src/features/city-view/scene/office/dashboard/
`-- InternalSimulationDashboardProvider.test.ts

src/features/city-view/scene/office/project-dashboard/
`-- GitHubProjectDashboardProvider.test.ts
```

**Structure Decision**: Extend existing GitHub type/service tests in place and avoid new provider/runtime modules. The current fixture provider remains the only provider implementation.

## Complexity Tracking

No constitution violations or additional complexity are required.

## Phase 0 Research

See `specs/036-github-read-integration-preflight/research.md`.

## Phase 1 Design

See:

- `specs/036-github-read-integration-preflight/data-model.md`
- `specs/036-github-read-integration-preflight/contracts/github-read-boundary.md`
- `specs/036-github-read-integration-preflight/quickstart.md`

## Post-Design Constitution Check

- **Spec First**: PASS. Design artifacts stay aligned with the preflight spec.
- **Plan Before Code**: PASS. The plan names exact files and validation.
- **Tasks Gate Implementation**: PASS. Tasks define all code/test work.
- **Preserve Application Stability**: PASS. No real provider, network, UI, persistence, sync, or mutation path is introduced.
- **Validation Is Required**: PASS. Automated validation is required.
