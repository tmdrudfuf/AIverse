# Implementation Plan: Daily Proof Repository Identity

**Branch**: `codex/060-daily-proof-repository-identity` | **Date**: 2026-07-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/060-daily-proof-repository-identity/spec.md`

## Summary

Add a provider-neutral `ProjectRegistryRepositoryIdentity` type to `ProjectRegistryEntry` (Spec 059's Project Registry), seed it for all three known projects, and render two new lines on the portal's project detail screen. Daily Proof's identity and its existing Spec-059 `remoteRepository` (GitHub-dashboard-only) are built from one shared set of seed-data constants so they cannot silently diverge. No live verification, no filesystem/network access, no new dashboard.

## Technical Context

**Language/Version**: TypeScript (strict), Next.js app, Phaser 3 for the office scene — unchanged from Spec 059.

**Primary Dependencies**: None new. Extends `src/features/city-view/scene/office/project-registry/` (Spec 059).

**Storage**: In-memory only, same `ProjectRegistryService` instance lifecycle as Spec 059.

**Testing**: Vitest, colocated `*.test.ts` files.

**Target Platform**: Browser (Next.js client + Phaser canvas). Confirmed by discovery: there is no server-side data-fetching layer, API route, or Node-only module (`fs`, `process.env` beyond `NODE_ENV`) anywhere in `src/features/city-view` — everything in this tree runs client-side. This is why no live filesystem existence check is attempted in this Spec: it would require new server infrastructure (an API route) that "describe, don't synchronize" doesn't justify.

**Constraints**: No live GitHub/GitLab/filesystem verification. No new configuration/env-loading mechanism (none exists today; introducing one is out of proportion to this Spec — see spec.md Out of Scope).

**Scale/Scope**: 3 seeded projects; the model must support a project with no known repository (Portfolio, AI Lab) without special-casing.

## Constitution Check

No project-specific constitution gates beyond `AGENTS.md` (as in Spec 059). Relevant constraints and how this plan satisfies them:

- "Make the smallest correct change" / "Do not make unrelated refactors" -> `remoteRepository`/`AIverseProjectRepositoryMapping` and every consumer in `github/`, `project-dashboard/`, `dashboard/` are untouched. The new field is additive on `ProjectRegistryEntry` and optional on `ProjectPortalProject`.
- "Repository identity must extend the existing project model rather than creating parallel models" -> added to `ProjectRegistryTypes.ts` (the existing model file), not a new `RepositoryRegistry` module; kept from duplicating Spec 059's `remoteRepository` via shared seed constants (see Data Flow below), not by merging two differently-shaped models together.

## Project Structure

### Documentation (this feature)

```text
specs/060-daily-proof-repository-identity/
├── spec.md
├── plan.md          # this file
├── tasks.md
└── quickstart.md
```

### Source Code (repository root)

```text
src/features/city-view/scene/office/
├── project-registry/
│   ├── ProjectRegistryTypes.ts             # MODIFIED: add ProjectRegistryRepositoryIdentity, ProjectRegistryRepositoryProvider, ProjectRegistryRepositoryConnectionState; add repositoryIdentity to ProjectRegistryEntry
│   ├── ProjectRegistrySeedData.ts          # MODIFIED: shared repo constants for daily-proof; repositoryIdentity for all 3 entries
│   ├── ProjectRegistryService.ts           # MODIFIED: cloneEntry() deep-clones repositoryIdentity
│   ├── ProjectRegistryService.test.ts      # MODIFIED: clone-independence coverage for repositoryIdentity
│   ├── ProjectRegistryAdapters.ts          # MODIFIED: toProjectPortalProject() maps repositoryIdentity
│   └── ProjectRegistryAdapters.test.ts     # MODIFIED: mapping coverage + shared-constant (User Story 3) test
├── OfficeProjectPortalTypes.ts             # MODIFIED: add optional repositoryIdentity to ProjectPortalProject
├── OfficeProjectPortalView.ts              # MODIFIED: renderDetail() — two new lines, additive to Spec 059's Repository/Company lines
├── OfficeProjectPortalView.test.ts         # MODIFIED: populated (Daily Proof) and sparse (Portfolio) rendering cases
└── OfficeProjectPortalRegistry.test.ts     # MODIFIED: createProjectPortalState() output covers repositoryIdentity
```

**Structure Decision**: Same module Spec 059 introduced — no new directory, no new domain module. `ProjectRegistryTypes.ts` gains the new type family; every other touched file already existed and already depended on `project-registry/`.

### UI surface decision: same portal detail screen, same right column

Unchanged reasoning from Spec 059: the Company Dashboard already reflects every registered project's name/status/source-signal for free (it reads `state.projects`, which is registry-derived), so nothing there needs to change for `repositoryIdentity` to "show up" at the project level. The two new lines are genuinely new *identity* detail (not a simulation-derived signal), so they belong where Spec 059 already put `Repository:`/`Company:` — the portal's project detail screen, right column (`panelX + 390`), directly below those two lines. This keeps one established pattern instead of introducing a second.

### Data flow

```text
ProjectRegistrySeedData.createDefaultProjectRegistryEntries()
  entry.repositoryIdentity  (new)         entry.remoteRepository (Spec 059, unchanged)
        \                                        /
         \-- both built from the same DAILY_PROOF_REPOSITORY
             local constant for daily-proof (owner/name/url/defaultBranch) --/
    -> ProjectRegistryService (deep-clones repositoryIdentity too)
      -> OfficeProjectPortalRegistry.createProjectPortalState()
           state.projects[i].repositoryIdentity = toProjectPortalProject(entry).repositoryIdentity
             -> OfficeProjectPortalView.renderDetail(state)
                  reads project.repositoryIdentity, renders two lines in the existing right column
```

`state.repositoryMappings` (built from `entry.remoteRepository` via the existing, unchanged `toRepositoryMapping`) and the GitHub-dashboard pipeline are entirely unaffected — they never read `repositoryIdentity`.

### Field mapping (`ProjectRegistrySeedData.ts`)

Shared local constant (new):

```ts
const DAILY_PROOF_REPOSITORY = {
  owner: "ai-verse",
  name: "daily-proof",
  url: "https://github.com/ai-verse/daily-proof",
  defaultBranch: "main",
} as const;
```

| Field | `daily-proof` | `portfolio` / `ai-lab` |
|---|---|---|
| `repositoryIdentity.provider` | `"github"` | `"local"` |
| `repositoryIdentity.owner` | `DAILY_PROOF_REPOSITORY.owner` | *(absent)* |
| `repositoryIdentity.name` | `DAILY_PROOF_REPOSITORY.name` | *(absent)* |
| `repositoryIdentity.url` | `DAILY_PROOF_REPOSITORY.url` | *(absent)* |
| `repositoryIdentity.defaultBranch` | `DAILY_PROOF_REPOSITORY.defaultBranch` | *(absent)* |
| `repositoryIdentity.localPath` | *(absent — see spec.md Out of Scope)* | *(absent)* |
| `repositoryIdentity.connectionState` | `"Configured"` | `"Unknown"` |
| `repositoryIdentity.lastVerifiedAt` | *(absent — nothing has been verified)* | *(absent)* |
| `remoteRepository` (existing, unchanged) | `{ owner: DAILY_PROOF_REPOSITORY.owner, name: DAILY_PROOF_REPOSITORY.name, url: DAILY_PROOF_REPOSITORY.url, visibility: "public" }` | *(absent, unchanged)* |

### View rendering (`OfficeProjectPortalView.renderDetail`)

Appended immediately after Spec 059's `Repository:`/`Company:` lines, same right column (`panelX + 390`), continuing the existing `projectInfoY` increment-by-26 pattern:

```ts
if (project.repositoryIdentity) {
  const providerLabel = formatProviderLabel(project.repositoryIdentity.provider); // "github" -> "GitHub", "local" -> "Local", else verbatim
  const nameLabel = project.repositoryIdentity.owner && project.repositoryIdentity.name
    ? `${project.repositoryIdentity.owner}/${project.repositoryIdentity.name}`
    : "Not yet known";
  this.addText(this.panelX + 390, projectInfoY, `Repo: ${nameLabel} (${providerLabel})`, mutedStyle());
  projectInfoY += 26;

  const statusLine = project.repositoryIdentity.defaultBranch
    ? `Default Branch: ${project.repositoryIdentity.defaultBranch}  ·  Status: ${project.repositoryIdentity.connectionState}`
    : `Status: ${project.repositoryIdentity.connectionState}`;
  this.addText(this.panelX + 390, projectInfoY, statusLine, mutedStyle());
}
```

With both Spec 059 lines and both new lines present (Daily Proof's case), the right column reaches `projectInfoY` up to `panelY + 252` — comfortably clear of the "Next Action" heading at `panelY + 326` (left column) and nowhere near the bottom instruction row, so this does not reintroduce Spec 059's Round-3 overlap bug (that bug was specifically about stacking too many lines into the *bottom-left* column; this column is independent, top-anchored, and has ~74px of headroom even at its fullest).

## Complexity Tracking

No Constitution Check violations — no table needed.
