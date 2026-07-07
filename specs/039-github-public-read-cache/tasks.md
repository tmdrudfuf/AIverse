# Tasks: GitHub Public Read Cache

**Input**: Design documents from `specs/039-github-public-read-cache/`
**Prerequisites**: `plan.md`, `spec.md`

## Phase 1: Existing System Review

- [x] T001 Inspect `GitHubRepositoryProvider`, `GitHubRepositoryService`, `GitHubPublicRepositoryProvider`, and `GitHubRepositoryReferenceResolver` to confirm the interface shape and the exact success/failure discriminant (`connectionStatus`).
- [x] T002 Inspect `OfficeProjectPortalController`'s constructor to confirm the existing decorator-composition seam from spec 038 and identify the exact line to extend.
- [x] T003 Confirm no existing test calls `getRepositorySummary` more than once in quick succession for the same project id, so adding a cache layer changes no existing test's expected outcome.

---

## Phase 2: Cache Decorator Implementation

- [x] T004 Create `src/features/city-view/scene/office/github/CachedGitHubRepositoryProvider.ts` exporting `DEFAULT_GITHUB_REPOSITORY_SUMMARY_CACHE_TTL_MS` and `CachedGitHubRepositoryProvider`, keyed by `projectId`, caching only `connectionStatus: "connected"` results, with an injectable clock.
- [x] T005 Add `src/features/city-view/scene/office/github/CachedGitHubRepositoryProvider.test.ts` covering: first read calls through; second read within TTL does not call through; read after TTL expiry calls through again; independent keys; no mutation-poisoning via returned clones; failure not cached as success; failure not itself cached (immediate retry calls through); unmapped-project path remains zero-fetch when the real provider is wrapped; interface shape unchanged; no mutation of any input.

---

## Phase 3: Controller Wiring

- [x] T006 Update `OfficeProjectPortalController.ts` to compose `CachedGitHubRepositoryProvider` around the existing `GitHubPublicRepositoryProvider` construction.
- [x] T007 Confirm the existing `OfficeProjectPortalController.repository-provider.test.ts` (spec 038) still passes unchanged, proving the cache's presence does not alter single-call behavior.

---

## Phase 4: Validation and Review Readiness

- [x] T008 Run `npm test`.
- [x] T009 Run `npx tsc --noEmit`.
- [x] T010 Run `npm run build`.
- [x] T011 Run `git diff --check`.
- [x] T012 Confirm no other production file was touched (`GitHubRepositoryProvider.ts`, `GitHubRepositoryService.ts`, `GitHubPublicRepositoryProvider.ts`, `GitHubRepositoryReferenceResolver.ts`, `MockGitHubRepositoryProvider.ts`, and all dashboard/view files remain unchanged).

## Dependencies

- Phase 1 must complete before implementation.
- Phase 2 (decorator) must exist before Phase 3 (controller wiring) uses it.
- Phase 4 runs after Phases 2 and 3.

## Implementation Strategy

1. Confirm the interface and success/failure discriminant already provide everything needed to decide cacheability.
2. Implement one small, pure decorator class with an injectable clock, tested in complete isolation from the controller.
3. Compose it into the controller at the exact seam already used for the resolver.
4. Confirm existing tests are unaffected and add focused new tests for every caching rule.
5. Run full validation and confirm no unrelated file changed.
