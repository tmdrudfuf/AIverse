# Research: GitHub Public Read Provider Wiring

## Does a trustworthy repository-reference source already exist?

Yes. `AIverseProjectRepositoryMapping` (`GitHubRepositoryTypes.ts`, established in spec 031) already carries an explicit `projectId -> { owner, name, url, visibility, defaultBranchHint }` association, seeded from a hardcoded, human-authored `REPOSITORY_MAPPINGS` constant in `OfficeProjectPortalRegistry.ts`. This is not derived from a project's display name or title at any point in the existing codebase — it is a separate, deliberate mapping. Decision: no prerequisite feature is needed; this is exactly the explicit mapping boundary the task's critical instruction asked to confirm exists (or, if absent, to build). It already exists.

## Should the resolver duplicate or reuse existing mapping-validity logic?

`validateAIverseProjectRepositoryMapping` already implements: missing mapping → unavailable, disabled mapping → unavailable, malformed owner/name (fails a display-safe regex) → unavailable, private repository → unauthenticated. This is already used by the dashboard-derivation layer (`InternalSimulationDashboardProvider`, `GitHubProjectDashboardProvider`) independently of whatever a repository summary contains. Decision: reuse this function directly in the new resolver rather than reimplementing a subset of its checks, avoiding logic duplication across the codebase (an explicit architecture constraint for this feature).

## Does resolving a reference for a private mapping matter, given the dashboard already overrides invalid mappings?

The dashboard layer calls `validateAIverseProjectRepositoryMapping` itself and, when invalid, uses that validation's status directly without ever consulting the repository summary. So even if the real provider successfully fetched something for a private repo, the dashboard would still show "Unauthenticated." However, an unauthenticated provider cannot read a private repository anyway (GitHub returns 404), so attempting the request would be a wasted, pointless network call. Decision: the resolver should not resolve a reference for disabled or private mappings, so no such wasted request is ever attempted — consistent with "do not fabricate a request for a mapping that should not be actively used."

## Does any existing test construct the real `OfficeProjectPortalController`?

No. A repo-wide search of `new OfficeProjectPortalController(` in test files returns zero matches. The only test file touching the repository/dashboard flow at the controller level (`OfficeProjectPortalController.project-dashboard.test.ts`) builds a harness via `Object.create(OfficeProjectPortalController.prototype)` and injects a stub `repositoryService` directly, bypassing the constructor. Decision: the constructor change is safe against all existing tests; this feature adds the first test that exercises the real constructor's provider wiring, using a Phaser scene stub matching the pattern already established in `OfficeProjectPortalView.test.ts`.

## Should a dual-provider router (mock for some projects, real for others) be introduced?

No. `GitHubPublicRepositoryProvider` already has a built-in, already-tested safe fallback for any project the resolver cannot resolve (returns the same `not_connected`/"not configured" shape `MockGitHubRepositoryProvider` returns for its own unmapped-project case). A single active provider is therefore sufficient; introducing a router/dispatch layer to alternate between mock and real providers per project would add complexity spec 037 already made unnecessary.

## Practical consequence: is a real network request now reachable from the running app?

Yes, for the one currently-mapped project (`daily-proof` → `ai-verse/daily-proof`). This is the explicit, intended purpose of this feature. Unauthenticated GitHub rate limits (~60/hour per IP) mean repeated dashboard opens during development could surface the `rate_limited` display state more often than the fixture-backed experience did; this is a known, accepted, already-safely-handled consequence, not a defect.
