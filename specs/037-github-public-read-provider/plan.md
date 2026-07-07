# Implementation Plan: GitHub Public Read Provider

**Branch**: `037-github-public-read-provider` | **Date**: 2026-07-06 | **Spec**: `specs/037-github-public-read-provider/spec.md`

**Input**: Feature specification from `specs/037-github-public-read-provider/spec.md`

## Summary

Implement `GitHubPublicRepositoryProvider`, the first `GitHubRepositoryProvider` implementation that reads real public GitHub repository data via unauthenticated `fetch` calls to `api.github.com`, mapping results into the existing `GitHubRepositorySummary` shape approved by spec 036's `GITHUB_PUBLIC_READ_SUMMARY_FIELDS` contract. The provider is fully self-contained, throws nothing, and is not wired into the running application as the active provider in this feature.

## Technical Context

**Language/Version**: TypeScript, Next.js application code (browser + Node runtime via Next.js)

**Primary Dependencies**: Global `fetch` (available via `dom` lib / Next.js runtime), existing `GitHubRepositoryProvider` interface, existing `GitHubRepositoryTypes.ts` helpers (`createGitHubExternalSourceStatus`, `GITHUB_PUBLIC_READ_SUMMARY_FIELDS`)

**Storage**: None; no persistence, no caching layer

**Testing**: Vitest, using `vi.stubGlobal("fetch", ...)` consistent with existing tests in `GitHubRepositoryService.test.ts` and `MockGitHubRepositoryProvider.test.ts`

**Target Platform**: Same Next.js application; provider itself has no UI

**Project Type**: Single new provider class + tests, extending the existing `src/features/city-view/scene/office/github/` module

**Performance Goals**: At most 3 network calls per `getRepositorySummary` invocation (repo metadata, latest commit, open PR count); no retries, no polling

**Constraints**: Public/unauthenticated reads only; no credentials; no mutation; no wiring into the live controller; must remain interchangeable with `MockGitHubRepositoryProvider`

**Scale/Scope**: One new provider file, one new test file, no changes to existing dashboard/controller/provider-neutral code

## Constitution Check

- **Spec First**: PASS. `spec.md` defines user stories, requirements, non-goals, and success criteria.
- **Plan Before Code**: PASS. This plan documents endpoints, mapping, and error handling before implementation.
- **Tasks Gate Implementation**: PASS. `tasks.md` will exist before code changes.
- **Preserve Application Stability**: PASS. No existing controller/provider/dashboard file is modified; the new provider is additive and inactive by default.
- **Validation Is Required**: PASS. `npm test`, `npx tsc --noEmit`, `npm run build`, `git diff --check` are required before completion.

No constitution violations are expected.

## Existing System Review

- `GitHubRepositoryProvider` (`GitHubRepositoryProvider.ts`) defines the only contract a provider must satisfy: `getRepositorySummary(projectId: string): Promise<GitHubRepositorySummary>`. It takes a **project id**, not an owner/name pair.
- `MockGitHubRepositoryProvider` resolves `projectId` directly against a hardcoded fixture map keyed by project id. It has no notion of owner/name resolution because its fixtures are self-contained.
- `GitHubRepositoryService` wraps any configured provider and collapses **any thrown error** into a generic `{ connectionStatus: "error", errorMessage: "Unable to load repository summary." }`. This is a defense-in-depth backstop, not the primary error-mapping mechanism.
- `GitHubRepositoryTypes.ts` already defines `AIverseProjectRepositoryMapping` (owner/name/visibility per project), `createGitHubExternalSourceStatus`, `GITHUB_PUBLIC_READ_SUMMARY_FIELDS`, and `createGitHubRepositorySnapshot` (maps a summary into dashboard-facing snapshot fields, already gracefully falling back to "Checks unavailable" when `checkStatus` is undefined).
- `validateAIverseProjectRepositoryMapping` already resolves the private-repository-to-`unauthenticated` mapping **before** any provider is called, using the mapping's own `visibility` field. The real provider is only ever invoked for repositories already validated as enabled/public/well-formed, so it does not need to re-derive "private" from a 404.
- `OfficeProjectPortalController` constructs `new GitHubRepositoryService(new MockGitHubRepositoryProvider())` and always calls `getRepositorySummary(projectId)`. This file is intentionally **not** changed by this feature (see FR-007).

## Architecture Approach

1. **Repository reference resolution without changing the provider interface.** `GitHubPublicRepositoryProvider`'s constructor accepts a `resolveRepositoryReference: (projectId: string) => { owner: string; name: string } | undefined` function, supplied by the caller (e.g. built from existing `AIverseProjectRepositoryMapping[]` data in a future integration step). This keeps `GitHubRepositoryProvider`'s method signature unchanged and preserves interchangeability with the mock.
2. **Network calls (unauthenticated `GET` only), at most 3 per read:**
   - `GET https://api.github.com/repos/{owner}/{name}` → repository identity, `default_branch`, `open_issues_count` (GitHub's count includes PRs), `pushed_at`/`updated_at`.
   - `GET https://api.github.com/repos/{owner}/{name}/commits?sha={default_branch}&per_page=1` → latest commit sha/message/author/date (skipped gracefully if the repo has no commits).
   - `GET https://api.github.com/repos/{owner}/{name}/pulls?state=open&per_page=100` → open pull request count, approximated as the returned array length (capped at 100; documented as a known approximation).
   - Derived `openIssueCount = max(0, repoData.open_issues_count - openPullRequestCount)` to separate GitHub's combined issue+PR count into a distinct issue-only figure.
   - `checkStatus` is left `undefined` in this slice; existing dashboard mapping already renders this as "Checks unavailable."
3. **Error and availability mapping (all non-throwing, returned as normal summaries):**
   - HTTP 403/429 with rate-limit signal (`x-ratelimit-remaining: 0` header, or 429 status) → `sourceStatus: rate_limited`, `connectionStatus: "error"`, generic reason.
   - `fetch` rejects (network/DNS failure) → `sourceStatus: offline`, `connectionStatus: "error"`, generic reason.
   - HTTP 404 or other non-2xx → `sourceStatus: unavailable`, `connectionStatus: "error"`, generic reason.
   - Malformed/unexpected JSON body (missing required fields, JSON parse failure) → `sourceStatus: unavailable`, `connectionStatus: "error"`, generic reason.
   - No repository reference resolvable for `projectId` → same shape as the mock's existing "missing project" fallback (`connectionStatus: "not_connected"`).
   - Every branch produces a display-safe `errorMessage` string with no interpolated URLs, response bodies, or header values, matching FR-004.
4. **Success mapping:** `sourceStatus: fresh` with `lastSuccessfulFetchAt` set to the time of the successful read; `connectionStatus: "connected"`; `lastUpdatedAt` from `pushed_at` (fallback `updated_at`).
5. **No wiring change.** `OfficeProjectPortalController.ts` continues constructing `MockGitHubRepositoryProvider` as before. The new provider is exported and fully tested but not imported by any existing production call site.

## Data Boundaries

- The provider only ever returns fields in `GITHUB_PUBLIC_READ_SUMMARY_FIELDS`; it does not add new properties to `GitHubRepositorySummary`.
- Repository mapping, project, task, employee, company focus, and advisory state are never read or written by this provider; it is a pure function of `(projectId, network response) -> GitHubRepositorySummary`.
- Dashboard consumers (`InternalSimulationDashboardProvider`, `GitHubProjectDashboardProvider`) are unchanged and continue to consume only the provider-neutral summary shape.

## File Touchpoints

- `src/features/city-view/scene/office/github/GitHubPublicRepositoryProvider.ts` (new)
- `src/features/city-view/scene/office/github/GitHubPublicRepositoryProvider.test.ts` (new)

No other production files are touched.

## Risk Assessment

- **Rate-limit risk**: Unauthenticated GitHub reads are limited to ~60 requests/hour per IP. Mitigation: provider is not wired into the live app in this feature; no retries or polling; rate-limited responses map to a clear, non-retrying display state.
- **Ambiguous error signals risk**: Unauthenticated requests receive 404 for both missing and private repositories, and secondary rate limits can also return 403. Mitigation: rely on existing upstream `validateAIverseProjectRepositoryMapping` for the private/unauthenticated case; treat 404 as `unavailable`, not `unauthenticated`, since this provider is never the source of truth for repository visibility.
- **PR count accuracy risk**: A single-page pull-request fetch undercounts repositories with more than 100 open PRs. Mitigation: documented as a known approximation in spec/plan; acceptable for a first minimal slice; full pagination deferred.
- **Scope creep risk**: Temptation to add check-run reads, auth, or live wiring. Mitigation: explicit non-goals in spec.md, FR-007 keeps the mock as the active provider, and this plan lists exactly 3 endpoints.

## Validation

Implementation must run:

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
```

Manual verification (no live UI change, since the provider is not wired in):

1. In a scratch script or REPL, construct `new GitHubPublicRepositoryProvider(() => ({ owner: "octocat", name: "Hello-World" }))` and call `getRepositorySummary("any-id")` against the real network to visually confirm the mapped summary shape.
2. Confirm no credentials, `.env` values, or tokens are read or required for this manual check.

## Post-Design Constitution Check

The design remains spec-first, read-only, provider-neutral, and scoped to a single new file pair. No credential flow, persistence layer, sync behavior, or live-wiring change is introduced.
