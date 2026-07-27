# Implementation Plan: Project Registry Foundation

**Branch**: `codex/059-project-registry-foundation` | **Date**: 2026-07-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/059-project-registry-foundation/spec.md`

## Summary

Replace the two hardcoded, parallel project-data arrays in `OfficeProjectPortalRegistry.ts` (`PROJECTS`, `REPOSITORY_MAPPINGS`) with a single `ProjectRegistryService`, seeded with all three currently-known projects (Daily Proof, Portfolio, AI Lab), and derive the existing `ProjectPortalProject[]`/`AIverseProjectRepositoryMapping[]` state from it via adapters. Daily Proof gains real owner/local-repository metadata, surfaced as two new optional lines on the portal's project detail screen. No new UI surface, no dashboard changes, no live external sync — this Spec is purely "the registry exists, is the one source of truth, and is observable for the first real project."

## Technical Context

**Language/Version**: TypeScript (strict), Next.js app, Phaser 3 for the office scene.

**Primary Dependencies**: None new. Reuses existing `GitHubRepositoryReference`/`AIverseProjectRepositoryMapping` types (`github/GitHubRepositoryTypes.ts`) and `ProjectPortalProjectStatus`/`ProjectPortalProjectType` (`OfficeProjectPortalTypes.ts`).

**Storage**: In-memory only (`ProjectRegistryService` holds a `Map` for the lifetime of `ProjectPortalState`), matching every other domain service in this codebase (tasks, employees, work sessions, company influence planning).

**Testing**: Vitest, colocated `*.test.ts` files, no `__tests__` directories (existing convention).

**Target Platform**: Browser (Next.js client + Phaser canvas), same as the rest of `city-view`.

**Project Type**: Single project (existing Next.js app; no new top-level directory).

**Performance Goals**: N/A — registry lookups are synchronous, in-memory map reads over at most a handful of entries.

**Constraints**: No Firebase, Expo, authentication, GitHub writes, issue sync, or build automation (explicitly deferred by the Spec). No new global mutable state beyond the existing `ProjectPortalState` object already owned by `OfficeProjectPortalController`.

**Scale/Scope**: 3 seeded projects today; the model and service must not require code changes to add a 4th (verified by User Story 2 / SC-004).

## Constitution Check

No `.specify/memory/constitution.md` gates beyond `AGENTS.md`'s repository-wide rules apply here (no project-specific constitution file with additional gates was found). Relevant `AGENTS.md` constraints and how this plan satisfies them:

- "Make the smallest correct change" / "Do not make unrelated refactors" -> new fields on `ProjectPortalProject` are optional, so the ~7 existing test files that hand-construct `ProjectPortalProject` literals require no edits. No dashboard file is touched (see spec.md "Out of Scope").
- "Preserve the existing architecture and coding style" -> new module follows the established `XxxTypes.ts` / `XxxService.ts` / colocated `Xxx.test.ts` naming and deep-clone-on-read convention already used by every other domain module under `scene/office/`.

## Project Structure

### Documentation (this feature)

```text
specs/059-project-registry-foundation/
├── spec.md
├── plan.md          # this file
├── tasks.md
└── quickstart.md
```

### Source Code (repository root)

```text
src/features/city-view/scene/office/
├── project-registry/                      # NEW directory
│   ├── ProjectRegistryTypes.ts             # NEW: ProjectRegistryEntry, ProjectRegistryOwner, ProjectRegistryLocalRepositoryIdentity
│   ├── ProjectRegistrySeedData.ts          # NEW: createDefaultProjectRegistryEntries() — daily-proof, portfolio, ai-lab
│   ├── ProjectRegistryService.ts           # NEW: class ProjectRegistryService (getAllProjects/getProject/registerProject)
│   ├── ProjectRegistryService.test.ts      # NEW
│   ├── ProjectRegistryAdapters.ts          # NEW: toProjectPortalProject(entry), toRepositoryMapping(entry)
│   └── ProjectRegistryAdapters.test.ts     # NEW
├── OfficeProjectPortalTypes.ts             # MODIFIED: widen ProjectPortalProjectType; add optional ownerCompany/localRepositoryLabel to ProjectPortalProject; add projectRegistryEntries to ProjectPortalState
├── OfficeProjectPortalRegistry.ts          # MODIFIED: remove PROJECTS/REPOSITORY_MAPPINGS consts; build projects/repositoryMappings/projectRegistryEntries from ProjectRegistryService
├── OfficeProjectPortalView.ts              # MODIFIED: renderDetail() — render Repository/Company line when present
└── OfficeProjectPortalRegistry.test.ts     # existing file (if present) or new coverage of createProjectPortalState()'s registry-derived output — see tasks.md
```

**Structure Decision**: New domain module (`project-registry/`) alongside the existing sibling domain modules (`tasks/`, `github/`, `dashboard/`, `project-dashboard/`, `progression/`), each of which already follows the `XxxTypes.ts` + `XxxService.ts` + colocated tests pattern. `OfficeProjectPortalRegistry.ts` becomes a thin composition point (constructs the service, calls the adapters) rather than a data file, mirroring how it already composes `CompanyInfluencePlanningService`.

### UI surface decision: portal detail screen, not the Company Dashboard

The Spec explicitly allows "the Company Dashboard (or the existing project area, whichever best fits the architecture)". This plan targets the **project portal's detail screen** (`OfficeProjectPortalView.renderDetail`), not the Company Dashboard, because:

1. The Company Dashboard's project list (`ProjectDashboardSummary.projects`, `InternalSimulationDashboardProvider.createProjectSummary`) is built from `context.projects`, which is `state.projects`. Once `state.projects` is registry-derived, every registered project's name/status/GitHub-source-signal already appears on the dashboard automatically — zero additional plumbing, zero changes to `CompanyDashboardTypes.ts`, `CompanyDashboardSectionId`, or `createDefaultUnavailableSections()`, and zero risk to the dashboard's existing test suite.
2. The two *new* fields this Spec introduces (`ownerCompany`, `localRepositoryLabel`) are project-identity metadata, not a simulation-derived signal like every other Company Dashboard field (health, workload, occupancy, bottlenecks) — they belong with the other static, per-project identity fields (`name`, `description`, `type`) that the portal's detail screen already owns and renders.
3. Adding a new Company Dashboard section for the same information the portal already shows would be pure duplication for no additional observable value, and would touch a much more heavily-tested file (`InternalSimulationDashboardProvider.test.ts`, `CompanyDashboardView.test.ts`) for zero net new capability.

### Data flow

```text
ProjectRegistrySeedData.createDefaultProjectRegistryEntries()
  -> ProjectRegistryService (constructor seeds a Map<id, ProjectRegistryEntry>)
    -> OfficeProjectPortalRegistry.createProjectPortalState()
         entries = service.getAllProjects()
         state.projectRegistryEntries = entries
         state.projects           = entries.map(toProjectPortalProject)
         state.repositoryMappings = entries.map(toRepositoryMapping).filter(Boolean)
           -> OfficeProjectPortalView.renderDetail(state)
                reads state.projects[selectedProjectIndex].ownerCompany / .localRepositoryLabel
```

No change flows through `OfficeProjectPortalController.ts` — it already reads `this.state.projects` and `this.state.repositoryMappings` wherever it needs them (repository provider lookups, dashboard snapshot, project-dashboard snapshot), and those continue to work unchanged because the *shape* of `ProjectPortalProject`/`AIverseProjectRepositoryMapping` is unchanged (only two new optional fields added).

### Adapter field mapping (`ProjectRegistryAdapters.ts`)

`toProjectPortalProject(entry: ProjectRegistryEntry): ProjectPortalProject`:

| `ProjectPortalProject` field | Derived from |
|---|---|
| `id` | `entry.id` |
| `name` | `entry.displayName` |
| `status` | `entry.lifecycleStatus` |
| `type` | `entry.projectType` |
| `description` | `entry.shortDescription` |
| `enabled` | `entry.lifecycleStatus === "Active"` |
| `linkedServices` | shared `createLinkedServices()` helper (unchanged — identical placeholder list for every project today, not registry data) |
| `nextAction` | `{ label: "Review project workspace", enabled: true, placeholder: true }` if `entry.lifecycleStatus === "Active"`, else `{ label: "Coming soon", enabled: false, placeholder: true }` — a lifecycle-status *rule*, not a per-project hardcode, so it generalizes to any future Active project |
| `ownerCompany` | `entry.owner.companyName` |
| `localRepositoryLabel` | `entry.localRepository.label` |

`toRepositoryMapping(entry: ProjectRegistryEntry): AIverseProjectRepositoryMapping | undefined`:

- Returns `undefined` when `entry.remoteRepository` is absent (Portfolio, AI Lab).
- Otherwise: `{ projectId: entry.id, sourceId: \`github:${owner}/${name}\`, repository: { ...entry.remoteRepository }, enabled: true, createdAt: entry.createdAt }` — reproduces today's hardcoded `daily-proof` mapping exactly (`sourceId: "github:ai-verse/daily-proof"`).

### Seed data (`ProjectRegistrySeedData.ts`)

| id | displayName | lifecycleStatus | projectType | localRepository | remoteRepository | owner.companyName |
|---|---|---|---|---|---|---|
| `daily-proof` | Daily Proof | Active | Company | `{ connected: true, label: "Connected (local)" }` | `{ owner: "ai-verse", name: "daily-proof", url: "https://github.com/ai-verse/daily-proof", visibility: "public" }` | Daily Proof Inc. |
| `portfolio` | Portfolio | Planned | Portfolio | `{ connected: false, label: "Not connected" }` | *(absent)* | AIverse Internal |
| `ai-lab` | AI Lab | Coming Soon | Lab | `{ connected: false, label: "Not connected" }` | *(absent)* | AIverse Internal |

`createdAt`/`lastActivityAt` for all three: `"2026-01-01T00:00:00.000Z"` (fixed literal, matching `DEFAULT_DASHBOARD_TIMESTAMP`'s existing precedent for deterministic seed timestamps — not derived from any live clock).

`shortDescription` text is copied verbatim from today's hardcoded `description` fields to avoid an unrelated wording change.

## Complexity Tracking

No Constitution Check violations — no table needed.
