# Tasks: GitHub Public Read Provider Wiring

**Input**: Design documents from `specs/038-github-public-read-provider-wiring/`
**Prerequisites**: `plan.md`, `spec.md`

## Phase 1: Existing System Review

- [x] T001 Inspect `AIverseProjectRepositoryMapping`, `validateAIverseProjectRepositoryMapping`, and `REPOSITORY_MAPPINGS`/`createRepositoryMappings` to confirm a trustworthy, explicit, non-guessed repository-reference source already exists.
- [x] T002 Inspect `OfficeProjectPortalController`'s constructor to confirm the exact composition seam (`new GitHubRepositoryService(new MockGitHubRepositoryProvider())`) and confirm `MockGitHubRepositoryProvider` is imported/used only at that one call site.
- [x] T003 Confirm no existing test constructs the real `OfficeProjectPortalController`; confirm the one test file touching this flow (`OfficeProjectPortalController.project-dashboard.test.ts`) bypasses the constructor via a harness, so the wiring change is safe against existing tests.
- [x] T004 Confirm `GitHubPublicRepositoryProvider` already exports `GitHubRepositoryReference`/`GitHubRepositoryReferenceResolver` and accepts a resolver via constructor injection, requiring no interface change.

---

## Phase 2: Resolver Implementation

- [x] T005 Create `src/features/city-view/scene/office/github/GitHubRepositoryReferenceResolver.ts` exporting `createRepositoryReferenceResolver`, reusing `validateAIverseProjectRepositoryMapping` and reading mappings via a live `getMappings()` thunk.
- [x] T006 Add `src/features/city-view/scene/office/github/GitHubRepositoryReferenceResolver.test.ts` covering: valid+enabled+public mapping resolves; missing mapping resolves to `undefined`; disabled mapping resolves to `undefined`; private mapping resolves to `undefined`; resolution never reads a project's display name; resolver reads live (not stale) mapping state; no mutation of the mapping array/objects.

---

## Phase 3: Controller Wiring

- [x] T007 Update `OfficeProjectPortalController.ts` imports: remove `MockGitHubRepositoryProvider`, add `GitHubPublicRepositoryProvider` and `createRepositoryReferenceResolver`.
- [x] T008 Update the constructor to build `this.repositoryService` with `GitHubPublicRepositoryProvider` and a resolver bound to `() => this.state.repositoryMappings`.
- [x] T009 Add `src/features/city-view/scene/office/OfficeProjectPortalController.repository-provider.test.ts` constructing the real controller (Phaser scene stub) with a stubbed global `fetch`, verifying: opening the mapped project's dashboard issues a real `GET` to `api.github.com`; opening an unmapped project's dashboard issues no `fetch` call and yields the safe fallback; a stubbed rate-limited/malformed response still degrades safely through the real path; no mutation of `projects`/`repositoryMappings`/`projectManagementSuggestions`.

---

## Phase 4: Validation and Review Readiness

- [x] T010 Run `npm test`.
- [x] T011 Run `npx tsc --noEmit`.
- [x] T012 Run `npm run build`.
- [x] T013 Run `git diff --check`.
- [x] T014 Confirm no other production file was touched (no dashboard, view, or `GitHubRepositoryProvider`/`MockGitHubRepositoryProvider`/`GitHubPublicRepositoryProvider` changes) and that `MockGitHubRepositoryProvider` remains fully intact and usable elsewhere.

## Dependencies

- Phase 1 must complete before implementation.
- Phase 2 (resolver) must exist before Phase 3 (controller wiring) uses it.
- Phase 4 runs after Phases 2 and 3.

## Implementation Strategy

1. Confirm the repository-reference source and constructor seam already exist; no prerequisite feature is needed.
2. Add one small, pure, fully-unit-tested resolver function reusing existing validation logic.
3. Swap exactly one constructor line and its imports in the controller.
4. Add one integration-style test proving the real path (not just the isolated provider/resolver) behaves safely for both mapped and unmapped projects.
5. Run full validation and confirm no unrelated file changed.
