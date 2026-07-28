# Feature Specification: Project Registry Foundation

**Feature Branch**: `codex/059-project-registry-foundation`

**Created**: 2026-07-27

**Status**: Draft

**Input**: User description: "Phase 2: Real Project Integration begins. Implement the Project Registry as the single source of truth describing real and simulated projects known to the company, expose it through the existing project area, and register Daily Proof as the first real project. No GitHub sync, Firebase, or auth integration yet."

## Current Product Limitation

`OfficeProjectPortalRegistry.ts` hardcodes three `ProjectPortalProject` entries (`daily-proof`, `portfolio`, `ai-lab`) directly in a module-level `PROJECTS` array, and a separate module-level `REPOSITORY_MAPPINGS` array duplicates `daily-proof`'s GitHub identity (`ai-verse/daily-proof`). There is no single model or service that owns "what projects exist" — the data is spread across two parallel hardcoded arrays, `ProjectPortalProject` has no concept of company ownership, local repository identity, or creation/activity timestamps, and there is no mechanism to add a project without editing this file's literals directly. AIverse cannot yet represent that a real, external software product (Daily Proof) is a first-class asset of the company, distinct from AIverse's own internal simulation placeholders.

## User-Visible Behavior Being Added

The AIverse Operating Terminal (`OfficeProjectPortalView.ts`, the office project portal's detail screen for a selected project) gains two new lines of information about the selected project, sourced from the new registry:

- `Repository: Connected (local)` (or `Repository: Not connected` for a project with no local repository identity yet).
- `Company: Daily Proof Inc.` (the owning company/organization name).

The project list itself is unchanged in appearance (it already renders each project's name and status), but the three listed projects — Daily Proof, Portfolio, AI Lab — are now all sourced from one `ProjectRegistryService` instead of two hardcoded arrays, and Daily Proof carries real owner/repository metadata instead of being indistinguishable from the two internal placeholders.

## In Scope

- A `ProjectRegistryEntry` domain model covering: id, display name, short description, lifecycle status, project type, local repository identity, optional remote repository metadata, owner (company), created date, and last-activity timestamp.
- A `ProjectRegistryService` that holds the canonical list of registered projects (seeded with Daily Proof, Portfolio, and AI Lab) and exposes read access (`getAllProjects`, `getProject`) plus a `registerProject` method for adding a project without any Daily-Proof-specific code path.
- Adapters that derive the existing `ProjectPortalProject[]` (portal list/detail state) and `AIverseProjectRepositoryMapping[]` (GitHub mapping state) from registry entries, replacing the two hardcoded arrays in `OfficeProjectPortalRegistry.ts` so the registry is the only place project data is defined.
- Two new optional display fields on `ProjectPortalProject` (`ownerCompany`, `localRepositoryLabel`), populated from the registry, and rendered as new lines on the portal's project detail screen.
- Daily Proof registered with real metadata: owner "Daily Proof Inc.", local repository connected, remote repository `ai-verse/daily-proof` (identical to today's hardcoded mapping — no behavior change to GitHub-linked dashboard/project-dashboard signals).

## Out of Scope

- Any live GitHub synchronization, Firebase integration, authentication, issue sync, or build automation for Daily Proof — the registration is metadata only, per Phase 2's own stated boundaries for this Spec.
- Runtime UI for registering a *new* project during a play session (no "add project" screen or input flow). `ProjectRegistryService.registerProject` exists as a domain capability so a future Spec can add that UI without redesigning the service, but this Spec does not wire it to any control.
- Changes to `ProjectWorkspace`/`ProjectWorkspaceSection` (the per-project workspace screen with Repository/Firebase/Analytics/Tasks/AI Agents sections) — unrelated to what data source describes a project's existence.
- Changes to the Company Dashboard's data model (`CompanyDashboardTypes.ts`, `InternalSimulationDashboardProvider.ts`). The dashboard already renders each project's name, status, and GitHub source signal from `state.projects`/`state.repositoryMappings`; because those are now registry-derived, registered projects already appear there with zero additional plumbing. No new dashboard section is added for registry-only fields (owner/local-repository-label) — those surface on the portal's project detail screen instead, per the Spec's own "whichever best fits" latitude.
- Persistence beyond the existing in-memory `ProjectPortalState` lifetime (no localStorage, no backend, no file-based store). The registry is in-memory, matching every other domain service in this codebase (tasks, employees, work sessions).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See Daily Proof as a company-owned project (Priority: P1)

As a player opening the AIverse Operating Terminal, I can select Daily Proof and see that it belongs to a real company ("Daily Proof Inc.") and has a connected local repository, so the office simulation now reads as representing a real software project rather than a hardcoded placeholder.

**Why this priority**: This is the concrete, observable proof that AIverse understands software projects as company assets — the spec's stated success criterion.

**Independent Test**: Render the project detail screen for `daily-proof` and confirm it shows `Repository: Connected (local)` and `Company: Daily Proof Inc.`.

**Acceptance Scenarios**:

1. **Given** the portal is open and Daily Proof is selected, **When** the detail screen renders, **Then** it shows `Repository: Connected (local)` and `Company: Daily Proof Inc.` alongside the existing name/status/description.
2. **Given** a fresh `createProjectPortalState()`, **When** `state.repositoryMappings` is inspected, **Then** it contains exactly one mapping, for `daily-proof` -> `ai-verse/daily-proof`, byte-for-byte equivalent to today's hardcoded mapping (no regression to GitHub-linked project-dashboard behavior).

---

### User Story 2 - Registry supports more than one project without code changes (Priority: P2)

As a developer extending AIverse to a second real project in a future Spec, I can call `ProjectRegistryService.registerProject(entry)` with a plain data object and have it appear in the portal's project list and detail screen, without touching `OfficeProjectPortalRegistry.ts`, `OfficeProjectPortalView.ts`, or any Daily-Proof-specific code path.

**Why this priority**: Directly demonstrates the spec's success criterion that the registry "clearly supports additional future projects without architectural changes" — but it is a developer-facing capability, not a player-visible behavior, so it ranks below User Story 1.

**Independent Test**: Construct a `ProjectRegistryService`, call `registerProject` with a new entry (e.g. a "Restaurant Ordering System" project with no remote repository), call `getAllProjects()`, and confirm the new entry is present and the seeded three are untouched.

**Acceptance Scenarios**:

1. **Given** a `ProjectRegistryService` seeded with the default three projects, **When** `registerProject` is called with a new, unique-id entry, **Then** `getAllProjects()` returns four entries including the new one, in insertion order.
2. **Given** a `ProjectRegistryService`, **When** `registerProject` is called with an id that already exists, **Then** it throws rather than silently overwriting the existing entry.

---

### User Story 3 - Internal placeholder projects remain visibly distinct from a real project (Priority: P3)

As a player, Portfolio and AI Lab (AIverse's own internal placeholders) show no company/repository info, so it stays visually obvious which projects are real, owned software products and which are internal placeholders.

**Why this priority**: A polish/consistency check rather than new capability — it confirms the registry model degrades sensibly for projects with no real-world identity yet.

**Independent Test**: Render the detail screen for `portfolio` and confirm it shows `Repository: Not connected` and no fabricated company name beyond a generic internal placeholder label.

**Acceptance Scenarios**:

1. **Given** the portal is open and Portfolio is selected, **When** the detail screen renders, **Then** it shows `Repository: Not connected` and `Company: AIverse Internal`.

### Edge Cases

- A registry entry with no `remoteRepository` (Portfolio, AI Lab): `toRepositoryMapping` returns `undefined` for it and it is excluded from `state.repositoryMappings` — the existing GitHub dashboard/project-dashboard code already treats "no mapping for this project id" as `sourceSignal: "internal"`, so no new fallback logic is required.
- A `ProjectPortalProject` fixture constructed directly in an existing test file (not via the registry) omits `ownerCompany`/`localRepositoryLabel` entirely: both fields are optional, and `OfficeProjectPortalView.renderDetail` omits the new line entirely when neither is present, so none of the ~7 existing test files that hand-construct `ProjectPortalProject` literals need to change.
- Two registry entries are registered with the same `id`: `registerProject` throws synchronously before mutating the registry, so the caller (not the registry) decides how to recover.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: `ProjectRegistryService` MUST hold Daily Proof, Portfolio, and AI Lab as its default seeded entries, with no entry's data hardcoded anywhere outside `ProjectRegistrySeedData.ts`.
- **FR-002**: `ProjectRegistryService.getAllProjects()` MUST return entries as independent copies (no shared mutable references back to internal registry state), matching the existing deep-clone convention in `OfficeProjectPortalRegistry.ts`.
- **FR-003**: `ProjectRegistryService.registerProject(entry)` MUST throw if `entry.id` already exists in the registry, and MUST NOT special-case any specific project id (including `daily-proof`) in its validation or storage logic.
- **FR-004**: `createProjectPortalState()` MUST derive `state.projects` and `state.repositoryMappings` entirely from `ProjectRegistryService.getAllProjects()` via adapter functions — no project data may be defined as a separate hardcoded array once this Spec lands.
- **FR-005**: The adapter deriving `AIverseProjectRepositoryMapping` from a registry entry MUST omit the entry from `state.repositoryMappings` when `remoteRepository` is absent, rather than fabricating placeholder repository data.
- **FR-006**: `OfficeProjectPortalView`'s project detail screen MUST render `Repository: {localRepositoryLabel}` and `Company: {ownerCompany}` when those fields are present on the selected project, and MUST render neither line when both are absent.
- **FR-007**: This change MUST NOT alter the existing `daily-proof` -> `ai-verse/daily-proof` GitHub repository mapping's field values (owner, name, url, visibility) — verified via the full existing `OfficeProjectPortalController.repository-provider.test.ts` and `GitHubProjectDashboardProvider.test.ts` suites continuing to pass unmodified.

### Key Entities

- **ProjectRegistryEntry** (new): `{ id, displayName, shortDescription, lifecycleStatus: ProjectPortalProjectStatus, projectType: ProjectPortalProjectType, localRepository: { connected: boolean; label: string }, remoteRepository?: GitHubRepositoryReference, owner: { companyName: string }, createdAt: string, lastActivityAt: string }` — the canonical description of a project known to the company.
- **ProjectRegistryService** (new): owns an in-memory map of `ProjectRegistryEntry` keyed by id; the single source of truth `createProjectPortalState()` reads from.
- **ProjectPortalProject** (extended): existing type gains optional `ownerCompany?: string` and `localRepositoryLabel?: string`, denormalized from the owning `ProjectRegistryEntry` for display.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Opening the portal and selecting Daily Proof shows `Repository: Connected (local)` and `Company: Daily Proof Inc.` on the detail screen.
- **SC-002**: `npm test` passes, including new tests for `ProjectRegistryService` (seeding, `getAllProjects`, duplicate-id rejection) and the adapter functions (`toProjectPortalProject`, `toRepositoryMapping`).
- **SC-003**: All pre-existing tests referencing `ProjectPortalProject`, `state.projects`, or `state.repositoryMappings` continue to pass unmodified — confirming the registry-derived data is byte-for-byte equivalent to the previous hardcoded arrays for the three existing projects.
- **SC-004**: A project can be added to the registry (per User Story 2) by writing a new `ProjectRegistryEntry` and calling `registerProject`, with no edits required to `OfficeProjectPortalRegistry.ts`, `OfficeProjectPortalView.ts`, or any dashboard file.

## Assumptions

- "Local repository identity" means a static, in-memory descriptor of whether a project has a known local codebase (`connected: boolean` + display `label`) — not a live filesystem check or a live Git connection. It is distinct from `GitHubExternalSourceStatus`/`GitHubRepositoryConnectionStatus`, which describe live remote-sync freshness and are unchanged by this Spec.
- Portfolio and AI Lab (AIverse's own internal placeholder projects) are registered too, with `owner.companyName: "AIverse Internal"` and no `remoteRepository` — registering all three (not just Daily Proof) is what makes the registry an actual single source of truth rather than a parallel path that only Daily Proof uses.
- `projectType` and `lifecycleStatus` reuse the existing `ProjectPortalProjectType`/`ProjectPortalProjectStatus` unions rather than introducing a second, parallel vocabulary; `ProjectPortalProjectType` is widened from a closed 3-value union to an open string union (`"Company" | "Portfolio" | "Lab" | (string & {})`, matching the existing `CompanyDashboardProjectSourceKind` idiom already used in this codebase) so future registered projects (e.g. "Mobile App", "Website") are not restricted to AIverse's own three internal category labels.
- `createdAt`/`lastActivityAt` are fixed ISO-8601 string literals in seed data, not `Date.now()` or wall-clock reads, matching this codebase's established preference for deterministic, snapshot-testable timestamps (e.g. `DEFAULT_DASHBOARD_TIMESTAMP` in `InternalSimulationDashboardProvider.ts`).
- No changes to `ProjectWorkspace` seed data (`WORKSPACES` in `OfficeProjectPortalRegistry.ts`) are required or made; workspaces remain keyed by project id exactly as today.
