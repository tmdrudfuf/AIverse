# Implementation Plan: GitHub Project Integration System

**Branch**: `codex/github-project-integration-system` | **Date**: 2026-07-04 | **Spec**: specs/031-github-project-integration-system/spec.md
**Input**: Feature specification from specs/031-github-project-integration-system/spec.md

## Summary

Add a read-only GitHub repository source for AIverse projects by mapping GitHub repository data into the existing provider-neutral Project Dashboard architecture. Internal simulation remains valid and authoritative for AIverse state. The approved first slice uses public repositories only, stores no credentials, uses developer-configured mapping, refreshes when the Project Dashboard opens, and defers private repository support.

## Technical Context

**Language/Version**: TypeScript with React/Next.js and Phaser
**Primary Dependencies**: Existing Project Dashboard provider contract, Office Project Portal, Company Dashboard, Company Influence, Projects, Tasks, Employee AI, Schedule, Progression, Insight, Knowledge, and existing GitHub repository service/provider files where appropriate
**Storage**: No credential storage approved; developer-configured mapping may exist in local app state/config only
**Testing**: Existing project test tooling (`npm test`) plus TypeScript/build validation
**Target Platform**: Browser
**Project Type**: Web game/simulation
**Performance Goals**: GitHub source reads must not block office simulation or project dashboard rendering
**Constraints**: Read-only, no repository mutation, no autonomous AI work, no speculative connector framework, public repositories only, no credential storage
**Scale/Scope**: One GitHub repository source mapped to one AIverse project for the first vertical slice

## Constitution Check

- Spec Kit workflow is followed: spec, plan, tasks, implementation.
- Existing code must be inspected before editing.
- Smallest correct implementation is preferred.
- Existing provider-neutral Project Dashboard architecture must be preserved.
- Application code changes can begin after spec, plan, and tasks are aligned; required security/product decisions were approved on 2026-07-04.
- Full validation must pass before implementation completion.

## Project Structure

### Documentation

```text
specs/031-github-project-integration-system/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   |-- github-project-provider.md
|   |-- repository-mapping.md
|   `-- source-status.md
`-- checklists/
    `-- requirements.md
```

### Expected Source Touchpoints

```text
src/features/city-view/scene/office/
|-- project-dashboard/
|   |-- ProjectDashboardTypes.ts
|   |-- InternalSimulationProjectDashboardProvider.ts
|   `-- ProjectDashboardView.ts
|-- github/
|   |-- GitHubRepositoryTypes.ts
|   |-- GitHubRepositoryProvider.ts
|   |-- GitHubRepositoryService.ts
|   `-- MockGitHubRepositoryProvider.ts
|-- OfficeProjectPortalController.ts
|-- OfficeProjectPortalTypes.ts
`-- OfficeProjectPortalView.ts
```

Exact source touchpoints must be confirmed by inspection before implementation.

## Approved Implementation Defaults

The user approved these first-slice defaults on 2026-07-04:

- public repositories only
- no credential storage
- developer-configured mapping
- refresh/read on Project Dashboard open
- no background sync

## Implementation Strategy After Approval

1. Inspect existing Project Dashboard provider contracts and existing GitHub service/provider files.
2. Extend provider-neutral project detail models only where current GitHub read-only data requires it.
3. Add explicit mapping model for AIverse project to GitHub repository reference.
4. Add a GitHub project provider/adapter that maps read-only repository snapshots into Project Dashboard snapshots.
5. Preserve internal simulation provider and make source status explicit.
6. Add tests for mapping, source status, stale/unavailable states, public-only behavior if approved, and no mutation controls.
7. Complete manual validation using quickstart.md.

## Data Boundaries

- Internal simulation owns AIverse project, task, employee, schedule, progression, insight, knowledge, work-session, and company influence state.
- GitHub source owns repository metadata, commits, issues, pull requests, checks, and freshness.
- Mapping owns only the relationship between an AIverse project and a repository reference.
- UI consumes provider-neutral Project Dashboard data, not GitHub API response shapes.

## Complexity Tracking

No implementation complexity is approved yet. Any auth, credential, background sync, or private repository support must be justified by an approved security/product decision.

## Validation

Before implementation completion:

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```

Manual validation follows specs/031-github-project-integration-system/quickstart.md.
