# Feature Specification: Daily Proof Repository Identity

**Feature Branch**: `codex/060-daily-proof-repository-identity`

**Created**: 2026-07-27

**Status**: Draft

**Input**: User description: "Extend the Project Registry (Spec 059) so each registered project can expose a canonical, provider-neutral repository identity describing where its source code lives. No remote synchronization or repository mutation. Daily Proof becomes the first project with repository identity."

## Current Product Limitation

Spec 059's `ProjectRegistryEntry` (`src/features/city-view/scene/office/project-registry/ProjectRegistryTypes.ts`) can only say a project has *some* local repository (`localRepository: { connected: boolean; label: string }`, a bare boolean-ish flag) and, separately, an *optional GitHub-specific* remote mapping (`remoteRepository?: GitHubRepositoryReference`) consumed only by the GitHub dashboard/project-dashboard pipeline (Specs 031/033). Neither field describes *where* a project's source actually lives in a provider-neutral way — there is no owner/name/default-branch/local-path model that could plausibly represent a GitLab repo, a local-only project, or any future provider. Portfolio and AI Lab have no repository description at all beyond "not connected". There is no single, canonical "repository identity" concept a future synchronization Spec could build on without redesigning the model.

## User-Visible Behavior Being Added

The project portal's detail screen (`OfficeProjectPortalView.renderDetail`, the same right-hand column Spec 059 added `Repository:`/`Company:` to) gains two more lines for the selected project, sourced from its new `repositoryIdentity`:

- `Repo: ai-verse/daily-proof (GitHub)` — owner/name and provider, or `Repo: Not yet known (Local)` when no owner/name is known yet.
- `Default Branch: main  ·  Status: Configured` — the default branch (omitted when unknown) and the repository's connection state.

Daily Proof shows real, provider-neutral identity data (`GitHub`, `ai-verse/daily-proof`, `main`, `Configured`). Portfolio and AI Lab show the honest "nothing known yet" state (`Repo: Not yet known (Local)`, `Status: Unknown`) rather than fabricated data — proving the model degrades safely for projects with no known repository.

## In Scope

- A new, provider-neutral `ProjectRegistryRepositoryIdentity` type on `ProjectRegistryEntry`: provider, optional owner/name/default branch/URL/local path, an explicit `connectionState` (`"Configured" | "Available" | "Unavailable" | "Unknown"`), and an optional `lastVerifiedAt` timestamp — present for every registered project (Daily Proof, Portfolio, AI Lab), not just Daily Proof.
- Daily Proof's `repositoryIdentity` populated with its real, already-known GitHub identity (`ai-verse/daily-proof`, `main`, `provider: "github"`, `connectionState: "Configured"`) — describing what is already known, not verifying it live.
- Portfolio and AI Lab given a genuinely sparse `repositoryIdentity` (`provider: "local"`, no owner/name/branch/path known, `connectionState: "Unknown"`) — demonstrating the model works for projects with no repository yet, without any project-specific code path.
- Two new display lines on the portal's project detail screen, additive to Spec 059's existing `Repository:`/`Company:` lines, in the same established right-column pattern.
- `ProjectRegistryService`'s existing deep-clone-on-read behavior (Spec 059) extended to cover the new nested `repositoryIdentity` object.

## Out of Scope

- Any live GitHub/GitLab API call, repository existence check, filesystem existence check, or network request. `connectionState` and `lastVerifiedAt` are the hooks a future synchronization Spec will populate with real verification — this Spec only adds the fields and seeds them with static, already-known values.
- Any repository write, branch sync, issue sync, pull request integration, Firebase, Expo, or authentication — unchanged from Spec 059's boundaries.
- A real local filesystem path for Daily Proof. This repository has no existing configuration mechanism (no `.env`, no `next.config` env passthrough, no config loader — confirmed by inspection; the only `process.env` read anywhere in `src/` is Next.js's own `NODE_ENV`). The Spec's own instruction to "use the real local repository path" is conditioned on "if the existing architecture already supports configurable metadata" — it does not, so `localPath` is left unset in seed data rather than inventing a machine-specific placeholder path in reusable source (which the Spec explicitly forbids) or building a new configuration layer (which is out of proportion to "describe, not synchronize").
- Changes to `remoteRepository`/`AIverseProjectRepositoryMapping` or anything in the `github/` module — that pipeline (Specs 031/033) is unrelated, already-shipped, and untouched; see Assumptions for how the two are kept from silently duplicating.
- Changes to the Company Dashboard's data model — unchanged from Spec 059's reasoning: the dashboard already reflects registry-derived projects for free, and per-project identity detail belongs on the portal's detail screen where Spec 059 already established the pattern.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See Daily Proof's real repository identity (Priority: P1)

As a player viewing Daily Proof's detail screen, I can see where its source code actually lives — a GitHub repository, its owner/name, and its default branch — described in a way that isn't tied to GitHub as the only possible provider.

**Why this priority**: This is the spec's core deliverable — repository identity becomes observable for the one project that has one.

**Independent Test**: Render Daily Proof's detail screen and confirm it shows `Repo: ai-verse/daily-proof (GitHub)` and `Default Branch: main  ·  Status: Configured`.

**Acceptance Scenarios**:

1. **Given** the portal is open and Daily Proof is selected, **When** the detail screen renders, **Then** it shows `Repo: ai-verse/daily-proof (GitHub)` and `Default Branch: main  ·  Status: Configured`.
2. **Given** a fresh `createProjectPortalState()`, **When** `state.projectRegistryEntries` is inspected, **Then** Daily Proof's `repositoryIdentity` equals `{ provider: "github", owner: "ai-verse", name: "daily-proof", url: "https://github.com/ai-verse/daily-proof", defaultBranch: "main", connectionState: "Configured" }` (no `localPath`, no `lastVerifiedAt`).

---

### User Story 2 - Repository identity degrades safely for a project with no known repository (Priority: P2)

As a player viewing Portfolio's or AI Lab's detail screen, I see an honest "nothing known yet" state rather than fabricated or missing information.

**Why this priority**: Proves the model is genuinely provider-neutral and safe-by-default, not just a Daily-Proof-specific field — directly demonstrating the spec's "ready for synchronization without architectural changes" success criterion.

**Independent Test**: Render Portfolio's detail screen and confirm it shows `Repo: Not yet known (Local)` and `Status: Unknown` with no default branch clause.

**Acceptance Scenarios**:

1. **Given** the portal is open and Portfolio is selected, **When** the detail screen renders, **Then** it shows `Repo: Not yet known (Local)` and `Status: Unknown`, with no `Default Branch:` clause (since none is known).

---

### User Story 3 - Repository identity is a model extension, not a parallel model (Priority: P3)

As a developer building the future GitHub-synchronization Spec, I can find exactly one place per project that describes its repository — `ProjectRegistryEntry.repositoryIdentity` — without needing to reconcile it against a second, silently-diverging copy of the same owner/name/branch data.

**Why this priority**: An architectural-integrity check rather than new player-visible behavior — it's what makes "ready for synchronization without architectural changes" true rather than aspirational.

**Independent Test**: Confirm Daily Proof's `remoteRepository` (Spec 059's existing GitHub-dashboard-only mapping) and `repositoryIdentity` are built from the same single seed-data constants, so a future edit to one cannot silently diverge from the other without also being visible in the other.

**Acceptance Scenarios**:

1. **Given** `ProjectRegistrySeedData.ts`, **When** Daily Proof's `remoteRepository.owner`/`.name`/`.url` and `repositoryIdentity.owner`/`.name`/`.url` are compared, **Then** they are identical, sourced from one shared local constant rather than two independently-typed literals.

### Edge Cases

- A project's `repositoryIdentity.provider` is a string this codebase doesn't have a display label for (a hypothetical future `"gitlab"` or similar): the view renders the raw provider string verbatim rather than `undefined` or throwing — matching the existing open-string-union display convention already used for `ProjectPortalProjectType`.
- `defaultBranch` is absent (true for Portfolio/AI Lab today): the rendered line omits the `Default Branch:` clause entirely rather than showing `Default Branch: undefined`.
- `owner`/`name` are both absent: the rendered repo line reads `Repo: Not yet known ({Provider})` rather than `Repo: undefined/undefined ({Provider})`.
- A `ProjectPortalProject` fixture constructed directly in an existing test file (not via the registry) omits `repositoryIdentity` entirely: the field is optional, and the view renders neither new line when it is absent — matching Spec 059's precedent for `ownerCompany`/`localRepositoryLabel`, so none of the existing hand-constructed `ProjectPortalProject` fixtures need to change.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: `ProjectRegistryEntry` MUST carry a `repositoryIdentity: ProjectRegistryRepositoryIdentity` for every registered project (Daily Proof, Portfolio, AI Lab) — never omitted, even when nothing is known yet.
- **FR-002**: `ProjectRegistryRepositoryIdentity.connectionState` MUST be one of exactly `"Configured" | "Available" | "Unavailable" | "Unknown"` and MUST NOT be derived from any live network or filesystem check in this Spec — it is static, seeded data describing what is already known.
- **FR-003**: Daily Proof's `repositoryIdentity` and `remoteRepository` (Spec 059's GitHub-dashboard mapping) MUST be built from the same shared local constants in `ProjectRegistrySeedData.ts`, so their owner/name/URL values cannot silently diverge.
- **FR-004**: `ProjectRegistryService`'s clone-on-read behavior (`getAllProjects`, `getProject`, `registerProject`) MUST deep-clone `repositoryIdentity` — mutating a returned entry's `repositoryIdentity` MUST NOT affect the registry's internal state.
- **FR-005**: `OfficeProjectPortalView`'s project detail screen MUST render the repo/provider line and the default-branch/status line only when `repositoryIdentity` is present on the selected project, and MUST omit the default-branch clause specifically when `defaultBranch` is absent.
- **FR-006**: This change MUST NOT alter `state.repositoryMappings`' existing values, `remoteRepository`'s shape, or any existing GitHub-dashboard-signal test's expected output — verified via the full existing `OfficeProjectPortalController.repository-provider.test.ts`, `GitHubProjectDashboardProvider.test.ts`, and `InternalSimulationDashboardProvider.test.ts` suites continuing to pass unmodified.

### Key Entities

- **ProjectRegistryRepositoryIdentity** (new): `{ provider: "local" | "github" | (string & {}), owner?: string, name?: string, defaultBranch?: string, url?: string, localPath?: string, connectionState: "Configured" | "Available" | "Unavailable" | "Unknown", lastVerifiedAt?: string }` — the canonical, provider-neutral description of where a project's source lives.
- **ProjectRegistryEntry** (extended): gains `repositoryIdentity: ProjectRegistryRepositoryIdentity`, alongside Spec 059's existing `localRepository`/`remoteRepository` (unchanged, still consumed by the GitHub-dashboard pipeline).
- **ProjectPortalProject** (extended): gains optional `repositoryIdentity?: ProjectRegistryRepositoryIdentity`, denormalized from the registry entry for display, following Spec 059's precedent for `ownerCompany`/`localRepositoryLabel`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Opening the portal and selecting Daily Proof shows `Repo: ai-verse/daily-proof (GitHub)` and `Default Branch: main  ·  Status: Configured` on the detail screen.
- **SC-002**: Opening the portal and selecting Portfolio (or AI Lab) shows `Repo: Not yet known (Local)` and `Status: Unknown`, with no fabricated owner/name/branch data.
- **SC-003**: `npm test` passes, including new/updated tests for the seed data's shared-constant invariant (User Story 3), the service's deep-clone coverage of `repositoryIdentity`, the adapter's mapping of `repositoryIdentity` onto `ProjectPortalProject`, and the view's rendering of both the populated and sparse cases.
- **SC-004**: All pre-existing tests referencing `ProjectPortalProject`, `state.projects`, `state.repositoryMappings`, or the GitHub-dashboard-signal pipeline continue to pass unmodified.
- **SC-005**: A future Spec adding real repository verification needs only to populate `connectionState`/`lastVerifiedAt` on the existing `ProjectRegistryRepositoryIdentity` shape — no new type, no new field on `ProjectPortalProject`, no new view line.

## Assumptions

- "Connection state" and "availability state" (both named in the feature request's Scope section) are represented as a single field, `connectionState`, with the four literal values the request's own "Connection States" section spells out verbatim (`Configured`, `Available`, `Unavailable`, `Unknown`) — read as one concept described twice, not two independent axes the request left unspecified. Introducing a second, unspecified state axis would be speculative modeling beyond what was asked.
- No real local filesystem path is seeded for any project (see Out of Scope) — `localPath` exists on the type as the field a future configuration-aware Spec will populate, but is deliberately left `undefined` everywhere in this Spec's seed data.
- Daily Proof's `provider` is `"github"` (its only concretely known repository home today), not `"local"` — Spec 059's `localRepository.connected: true` reflected a *simulated* local-workspace flag for the portal's older, cruder display, not a real filesystem check; this Spec does not claim more local knowledge than actually exists.
- Portfolio and AI Lab default to `provider: "local"` with everything else absent — a neutral choice reflecting "no repository has been established yet," not a claim that either project *will* end up local-only.
- `remoteRepository` (Spec 059, GitHub-dashboard-only) and the new `repositoryIdentity` are deliberately kept as two fields rather than merged into one, because `remoteRepository`'s consumers (`toRepositoryMapping`, `validateAIverseProjectRepositoryMapping`, the GitHub dashboard/project-dashboard pipeline) depend on GitHub-specific fields (`visibility`) that do not belong in a provider-neutral model. Keeping them separate — but sourced from the same shared constants for Daily Proof — avoids both an unrelated refactor of already-shipped Spec 031/033 code and silent data duplication.
