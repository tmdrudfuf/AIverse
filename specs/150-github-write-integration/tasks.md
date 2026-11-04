# Tasks: GitHub Write Integration

**Input**: Design documents from `specs/150-github-write-integration/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/github-publish-bridge.md (all present)

**Tests**: Included, following Spec 149's own pattern — real, harmless subprocesses (a scratch git repo this suite creates itself, with a fake/local-only `origin` remote where a real network push cannot be exercised safely) rather than mocking `child_process`.

## Phase 1: Setup

- [X] T001 Confirm `src/app/api/github-publish/` does not already exist (it doesn't — verified during planning).

---

## Phase 2: Foundational (Blocking Prerequisites)

- [X] T002 [P] Define `PublishAttempt`, `PublishAuditRecord`, `PublishPreview`, `GitHubPublishRefusalReason` types in `src/app/api/github-publish/_lib/GitHubPublishTypes.ts`.
- [X] T003 [P] Write `GitHubPublishRegistry.test.ts` first (mirrors `RuntimeBridgeRunRegistry.test.ts`): one active attempt per working-directory key, path-traversal-safe audit writes, exclusive (`wx`) writes. (depends on T002)
- [X] T004 Implement `GitHubPublishRegistry.ts` by copying `RuntimeBridgeRunRegistry`'s proven shape (concurrency guard + audit-file writer to `.agent-workflow/github-publishes/`), adapted to this feature's own types. Must make T003 pass.
- [X] T005 [P] Write `GitHubPublishSequence.test.ts` first, using a real scratch git repo (created fresh per test, `git init`, a local-only second scratch repo used as its `origin` remote so `git push` is real but never touches the network) covering: (a) uncommitted changes get committed and pushed with a generated message; (b) already-committed-but-unpushed commits get pushed without an extra empty commit; (c) a clean, non-ahead repo refuses `nothing_to_publish` without creating any branch; (d) a missing `origin` remote refuses `no_remote`; (e) a failure at any step (simulate by pointing the push at an unreachable remote) reports `failed` with the correct `failureStep` and whatever `branchName`/`commitMessage` had already been set.
- [X] T006 Implement `GitHubPublishSequence.ts`: the fixed branch/commit/push sequence (research.md Decision 4), computing "ahead of default branch" and "uncommitted changes" *before* creating any branch so a true no-op never creates one; using `runRuntimeBridgeProcess` (reused, not duplicated) for every `git` subprocess. Must make T005 pass. (depends on T002, and reuses `src/app/api/runtime/_lib/RuntimeBridgeProcessRunner.ts` as-is)
- [X] T007 [P] Write a small commit/PR message generator (`generatePublishMessage(changedFiles: string[]): { commitMessage, prTitle, prBody }`) with its own unit test, covering zero/one/many changed files.

**Checkpoint**: Foundational ready — the publish sequence works and is tested against real (but network-free) git repos.

---

## Phase 3: User Story 1 - Publish a Real Maintenance Change (Priority: P1) 🎯 MVP

### Tests for User Story 1

- [X] T008 [P] [US1] Write `src/app/api/github-publish/publish/route.test.ts` first: happy path (real scratch repo, real-but-local-only remote) resolves `published` with a real `branchName`/`commitMessage`; `nothing_to_publish` when clean and not ahead; `already_running` for a second concurrent attempt on the same working directory.
- [X] T009 [P] [US1] Write `GitHubPublishClient.test.ts` (browser-side, fake `fetch`) mirroring `ServerBridgeImplementerRuntimeProvider.test.ts`'s style: POSTs the working directory, maps the response.

### Implementation for User Story 1

- [X] T010 [US1] Implement `POST /api/github-publish/publish` in `src/app/api/github-publish/publish/route.ts`: same trusted-origin check as the execute route (reuse `isTrustedRuntimeBridgeRequest`), re-validate the working directory server-side, check authorization (T013) and remote existence, enforce the concurrency guard (T004), run the sequence (T006), write the audit record. Must make T008 pass.
- [X] T011 [US1] Implement `GitHubPublishClient.ts` (browser-side `fetch()` wrapper, no node imports) in `src/features/city-view/scene/office/github-publish/`. Must make T009 pass.
- [X] T012 [US1] Wire `GitHubPublishClient` into `OfficeProjectPortalController.ts` (a new field + a `publishToGitHub(workingDirectory)` passthrough method, mirroring how `ServerBridgeImplementerRuntimeProvider` is already retained), and add a "Publish to GitHub" button to `CompanyOfficeScene.ts`'s project backlog form, mirroring T028/T029's exact styling/append/cleanup pattern.

**Checkpoint**: User Story 1 is independently functional — triggering the button genuinely pushes and opens a PR for a registered real project.

---

## Phase 4: User Story 2 - See What Will Be Published Before It Happens (Priority: P1)

### Tests for User Story 2

- [X] T013 [P] [US2] Write `src/app/api/github-publish/preview/route.test.ts` and `status/route.test.ts` first: preview lists real changed files and the same generated message T007 would produce; status reflects a real (or stubbed-failing) `gh auth status` call.

### Implementation for User Story 2

- [X] T014 [US2] Implement `GET /api/github-publish/status/route.ts` (runs `gh auth status`, maps exit code + scope check to `{authorized}`) and `GET /api/github-publish/preview/route.ts` (runs `git status --porcelain` + the ahead-count check, reuses T007's generator). Must make T013 pass.
- [X] T015 [US2] Extend `GitHubPublishClient.ts` with `getStatus()`/`getPreview()`, and show the preview (changed files + planned commit message) in the office UI before the Publish button is enabled, mirroring T028's enablement-label pattern.

**Checkpoint**: Both P1 stories work together.

---

## Phase 5: User Story 3 - Honest Refusal When Publishing Isn't Possible (Priority: P2)

### Tests for User Story 3

- [X] T016 [P] [US3] Extend T008's route test with: not-authorized refusal (stub `gh auth status` failing), no-remote refusal (a scratch repo with no `origin` configured), and a mid-sequence failure (push to an unreachable remote) reporting `failed` with the correct `failureStep` and the `branchName` that was actually created.

### Implementation for User Story 3

- [X] T017 [US3] Confirm (add any missing assertions) that every refusal/failure path writes its own audit record (mirroring Spec 149's round-4 `N-001` fix) and that the registry frees the project immediately on any terminal outcome.

**Checkpoint**: All three user stories independently functional and tested.

---

## Phase 6: Polish & Validation

- [X] T018 [P] Add a brief note to `docs/roadmap.md` Phase 4 pointing at this feature as its public-read-to-write step, noting new-project design remains separately deferred.
- [X] T019 `npm test`.
- [X] T020 `npx tsc --noEmit`.
- [X] T021 `npm run build`.
- [X] T022 `git diff --check` / `git diff --cached --check`.
- [ ] T023 Walk through `quickstart.md` manually against a real, disposable scratch GitHub repository — the one verification (a genuine push + `gh pr create` against real GitHub) this implementation pass should not do unsupervised, left for the operator exactly as Spec 149's T027 was.

---

## Dependencies & Execution Order

- Phase 1 before all phases.
- Phase 2 (Foundational) blocks every user story.
- Phase 3 (US1) and Phase 4 (US2) can proceed in parallel once Phase 2 is done; both are P1 and together form the MVP.
- Phase 5 (US3) depends on T010's route existing.
- Phase 6 depends on all prior phases.

## Implementation Strategy

**MVP first**: Phases 1 → 2 → 3 → 4 → stop and manually verify via quickstart.md's "real publish end to end" section before Phase 5's refusal-path polish. Phase 5 adds real safety value (no silent failure) but Phase 3+4 already deliver the feature's core promise.
