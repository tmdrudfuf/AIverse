# Research: GitHub Public Read Refresh Control

## Is a UI refresh action feasible without broad dashboard redesign?

Yes. `OfficeProjectPortalController` already has an isolated `viewMode: "repository-detail"` screen (`openRepositoryDetail`/`updateRepositoryDetailInput`/`renderRepositoryDetail`) that exists solely to show one project's repository summary. Today `updateRepositoryDetailInput` only reacts to `escapePressed`; every sibling `update*Input` method in the same class already follows an `if (input.actionPressed || input.enterPressed) { ... }` convention for its primary action (e.g., `updateWorkspaceInput`, `updateTaskListInput`). Adding that same branch here, guarded by the existing `hasRepositoryMapping` check, is a one-branch addition to an already-narrow screen — not a redesign. Company Dashboard and Project Dashboard rendering are untouched. Decision: implement the UI action; the critical instruction's "don't force UI work" concern does not apply here because the seam already exists and is this narrow.

## Where should the refresh capability live: cache, service, or controller?

`CachedGitHubRepositoryProvider` is the only layer that knows what "bypass the cache" means — `GitHubPublicRepositoryProvider` has no cache to bypass, and the controller shouldn't need to know caching exists at all. Decision: add `refreshRepositorySummary` to `CachedGitHubRepositoryProvider`, sharing its cache-update logic with the normal read path via one private helper (`fetchAndUpdateCache`), so a refresh and a cache-miss read always apply the identical store-or-delete rule and can never drift apart through independent maintenance.

## How does `GitHubRepositoryService` expose this without changing `GitHubRepositoryProvider`?

`GitHubRepositoryService`'s constructor is widened from accepting `GitHubRepositoryProvider` to `GitHubRepositoryProvider & Partial<GitHubRepositoryRefresher>`. Because the added method is optional, this is structurally backward compatible: `MockGitHubRepositoryProvider` instances and every existing test's plain `{ getRepositorySummary: fn }` stub objects still satisfy the widened type with no changes. `GitHubRepositoryProvider` itself (the interface every provider implements) is untouched, satisfying "keep `GitHubRepositoryProvider` interface stable." `GitHubRepositoryService.refreshRepositorySummary` falls back to a plain `getRepositorySummary` call when the wrapped provider has no native refresh — correct behavior, since a provider with no cache has nothing to bypass.

## Should refresh failure preserve or clear the previous cache entry?

Clear it — and this isn't actually a new decision to make. `refreshRepositorySummary` calls the same `fetchAndUpdateCache` helper the normal read path already uses, and that helper already deletes any existing cache entry on a non-`"connected"` result (the policy spec 039 established and this project already reviewed and approved: never let a stale success survive a later failure, and never cache a failure itself). Reusing the helper means this policy applies to refresh automatically and identically, rather than needing a second, potentially-divergent decision.

## Does refresh need a new field to mark "came from cache" vs. "just refreshed"?

No. `GitHubPublicRepositoryProvider` already sets `sourceStatus.lastSuccessfulFetchAt` to the current time only when it performs an actual successful network read; `CachedGitHubRepositoryProvider` returns an unmodified clone of the originally-stored summary on a cache hit, so that timestamp is naturally frozen at whenever the data was actually fetched. This already lets any caller distinguish "just refreshed" (timestamp changes) from "served from cache" (timestamp unchanged) without adding a field that would expand the fixed `GITHUB_PUBLIC_READ_SUMMARY_FIELDS` boundary from specs 036-039.

## Does refresh reachability for unmapped/disabled/private/malformed mappings need separate testing per sub-case?

No, for the same reason spec 039's own tests didn't re-test each sub-case at the cache layer: `GitHubRepositoryReferenceResolver` already resolves all of these cases (missing, disabled, private, malformed owner/name) to a single unified `undefined` result (tested exhaustively in spec 038), and `GitHubPublicRepositoryProvider` treats "resolver returned undefined" as one code path regardless of the underlying reason (also already tested). Since neither the cache nor the refresh method can distinguish *why* the resolver returned `undefined`, one test using an always-`undefined` resolver is sufficient to prove refresh's zero-fetch behavior for the whole class of cases; re-testing each sub-case here would only duplicate spec 038's existing coverage.
