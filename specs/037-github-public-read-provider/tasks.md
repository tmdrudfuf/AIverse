# Tasks: GitHub Public Read Provider

**Input**: Design documents from `specs/037-github-public-read-provider/`
**Prerequisites**: `plan.md`, `spec.md`

## Phase 1: Existing System Review

- [x] T001 Inspect `GitHubRepositoryProvider.ts`, `MockGitHubRepositoryProvider.ts`, and `GitHubRepositoryService.ts` to confirm the exact interface and error-collapsing behavior the new provider must satisfy.
- [x] T002 Inspect `GitHubRepositoryTypes.ts` for `GITHUB_PUBLIC_READ_SUMMARY_FIELDS`, `createGitHubExternalSourceStatus`, `createGitHubRepositorySnapshot`, and `validateAIverseProjectRepositoryMapping` to confirm mapping/fallback rules already in place.
- [x] T003 Confirm no existing `fetch` usage pattern exists elsewhere in the codebase to establish this as the first real network call.

---

## Phase 2: Provider Implementation

- [x] T004 Create `src/features/city-view/scene/office/github/GitHubPublicRepositoryProvider.ts` implementing `GitHubRepositoryProvider`, accepting a repository-reference resolver and optional injectable `fetch` in its constructor.
- [x] T005 Implement repository metadata + latest commit + open PR count reads (at most 3 `GET` calls), mapping into `GitHubRepositorySummary` fields only.
- [x] T006 Implement display-safe error mapping for rate-limited, offline/network-failure, not-found/other non-2xx, and malformed-response cases, always returning a normal (non-throwing) summary.
- [x] T007 Implement the "no repository reference resolvable" fallback matching the mock provider's existing unmapped-project shape.

---

## Phase 3: Tests

- [x] T008 Add a success-path test asserting the mapped summary matches stubbed GitHub API responses and stays within `GITHUB_PUBLIC_READ_SUMMARY_FIELDS`.
- [x] T009 Add a rate-limit test (403 + `x-ratelimit-remaining: 0`) asserting `sourceStatus.state === "rate_limited"` and a display-safe, non-leaking `errorMessage`.
- [x] T010 Add a network/offline-failure test (stubbed `fetch` rejects) asserting `sourceStatus.state === "offline"`.
- [x] T011 Add a malformed-response test (invalid JSON / missing fields) asserting `sourceStatus.state === "unavailable"` without throwing.
- [x] T012 Add a not-found (404) test asserting `sourceStatus.state === "unavailable"`.
- [x] T013 Add a test proving no request ever includes an `Authorization` header, credential, or token, and only `GET` requests are issued.
- [x] T014 Add a read-only regression test snapshotting an external repository-mapping-like input before/after a provider call to confirm no mutation.

---

## Phase 4: Validation and Review Readiness

- [x] T015 Run `npm test`.
- [x] T016 Run `npx tsc --noEmit`.
- [x] T017 Run `npm run build`.
- [x] T018 Run `git diff --check`.
- [x] T019 Confirm no existing production file (`OfficeProjectPortalController.ts`, dashboard/provider files) was modified — the new provider must be additive-only and inactive by default.

## Dependencies

- Phase 1 must complete before implementation.
- Phase 2 blocks Phase 3.
- Phase 4 runs after Phase 2 and Phase 3 are complete.

## Implementation Strategy

1. Confirm the exact provider interface and existing fallback/mapping helpers.
2. Implement the provider with at most 3 minimal, unauthenticated `GET` calls.
3. Map every anticipated failure mode to an existing display-safe state without throwing.
4. Add focused tests for success and every failure mode, plus a no-mutation and no-auth/no-write regression test.
5. Run full validation and confirm no existing file outside the two new provider files was touched.
