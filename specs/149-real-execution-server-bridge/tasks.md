# Tasks: Real Execution Server Bridge

**Input**: Design documents from `specs/149-real-execution-server-bridge/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/real-execution-bridge.md (all present)

**Tests**: Included — the spec's safety/honesty requirements (FR-005 through FR-011) are exactly the kind of behavior a deterministic fake process adapter can verify without spawning a real process, matching this codebase's existing pattern (`ClaudeImplementerRuntimeProvider.test.ts`, `agentRunner.test.ts`).

## Phase 1: Setup

- [ ] T001 Confirm `src/app/api/` does not already contain a `runtime/` directory (it doesn't — verified during planning); no scaffolding beyond what each task below creates.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The async, cancellable process runner and the per-project run registry that every user story's route logic depends on.

- [ ] T002 [P] Define `RealRun`, `RunAuditRecord`, `RuntimeBridgeRefusalReason` and the request/response shapes from `contracts/real-execution-bridge.md` in `src/app/api/runtime/_lib/RuntimeBridgeTypes.ts`.
- [ ] T003 [P] Write `src/app/api/runtime/_lib/RuntimeBridgeProcessRunner.test.ts` first (deterministic fake `spawn` — never a real process) covering: normal completion, non-zero exit, timeout → SIGTERM → grace period → SIGKILL, and external cancel while running (depends on T002).
- [ ] T004 Implement `src/app/api/runtime/_lib/RuntimeBridgeProcessRunner.ts` — async `node:child_process.spawn` wrapper following the proven shutdown pattern from `tools/agent-workflow/agentRunner.js`'s `createDefaultProcessAdapter` (timeout, grace-period SIGTERM-then-SIGKILL, captured stdout/stderr, honest `terminationReason`), additionally exposing a `cancel()` handle the caller can invoke on a specific in-flight run (the one capability that module does not expose). Reuses — does not modify — the existing module. Lives under `app/api/`, never under `src/features/`, so it can never reach the client bundle. Must make T003 pass.
- [ ] T005 [P] Write `src/app/api/runtime/_lib/RuntimeBridgeRunRegistry.test.ts` first, covering: only one active run per `projectId` (second concurrent request is refused `already_running`), and that a terminal run's record is written to `.agent-workflow/real-runs/<projectId>/<runId>.json` with the fields from data-model.md's `RunAuditRecord` (depends on T002).
- [ ] T006 Implement `src/app/api/runtime/_lib/RuntimeBridgeRunRegistry.ts` — the in-memory `Map<projectId, RunHandle>` concurrency guard plus the audit-file writer. Must make T005 pass. (depends on T004 for the run handle shape)

**Checkpoint**: Foundation ready — process execution and the concurrency/audit layer work and are tested without spawning anything real.

---

## Phase 3: User Story 1 - An Approved Run Actually Executes (Priority: P1) 🎯 MVP

**Goal**: An approved Implementer or Reviewer run against a registered real project genuinely executes and reports a real terminal status in the office UI.

**Independent Test**: With real execution enabled (stub/fake-enabled in tests; see quickstart.md for the manual real-CLI verification) and a registered project, approving a queued run reaches a genuine terminal status whose evidence is drawn from the executed command, not a canned value.

### Tests for User Story 1

- [ ] T007 [P] [US1] Write `src/app/api/runtime/execute/route.test.ts` first: POST happy path reuses the existing `isSafeImplementerCommand` validation, resolves the registered project's own path (refusing per FR-011 on mismatch — fake project-registry lookup in the test), and returns a `completed`/`failed` terminal status shaped per the contract, using the fake process runner from T003's harness (no real spawn).
- [ ] T008 [P] [US1] Write `ServerBridgeImplementerRuntimeProvider.test.ts` and `ServerBridgeReviewerRuntimeProvider.test.ts` first, in their respective `*-runtime/` directories: `invoke()` calls `fetch("/api/runtime/execute", ...)` with the right body and maps the JSON response back onto the existing `ImplementerRuntimeProviderResult`/reviewer-equivalent shape unchanged (fake `fetch`, no network).

### Implementation for User Story 1

- [ ] T009 [US1] Implement `POST /api/runtime/execute` in `src/app/api/runtime/execute/route.ts` (Node runtime): validate request shape, check enablement (refuse `not_enabled`), resolve+verify the registered project's local path (refuse `project_unavailable` per FR-011), run the existing safety validators (refuse `unsafe_command`), hand off to `RuntimeBridgeRunRegistry`/`RuntimeBridgeProcessRunner` (refuse `already_running` when applicable), and respond per the contract once terminal. Must make T007 pass. (depends on T004, T006)
- [ ] T010 [P] [US1] Implement `ServerBridgeImplementerRuntimeProvider.ts` in `src/features/city-view/scene/office/implementer-runtime/` implementing the existing `ImplementerRuntimeProvider` contract via `fetch`. Must make T008's implementer test pass. (depends on T002)
- [ ] T011 [P] [US1] Implement `ServerBridgeReviewerRuntimeProvider.ts` in `src/features/city-view/scene/office/reviewer-runtime/` implementing the existing `ReviewerRuntimeProvider` contract via `fetch`. Must make T008's reviewer test pass. (depends on T002)
- [ ] T012 [US1] In `OfficeProjectPortalRegistry.ts`'s `createLinkedServices`, swap the default-constructed Implementer/Reviewer runtime providers from `ClaudeImplementerRuntimeProvider`/`CodexReviewerRuntimeProvider` to `ServerBridgeImplementerRuntimeProvider`/`ServerBridgeReviewerRuntimeProvider`. Smallest possible diff — construction site only. (depends on T010, T011)
- [ ] T013 [US1] Update/extend `OfficeProjectPortalController.implementer-runtime.test.ts` and `OfficeProjectPortalController.reviewer-runtime.test.ts` to assert the controller's default-wired service now resolves to the server-bridge providers (same assertions these tests already make about the controller's own default-wired service, per the `testHelpers.ts` convention already used there).

**Checkpoint**: User Story 1 is independently functional — an approved run reaches a real `fetch`-mediated terminal status, verifiable entirely with fakes (no real CLI needed yet).

---

## Phase 4: User Story 2 - Real Execution Is an Explicit, Visible Choice (Priority: P1)

**Goal**: The operator can always see whether real execution is enabled on this machine, and it is never silently on.

**Independent Test**: With enablement faked both ways in tests, `GET /api/runtime/status` reports the correct boolean and the office UI reflects it.

### Tests for User Story 2

- [ ] T014 [P] [US2] Write `src/app/api/runtime/status/route.test.ts` first: returns `{enabled:true}`/`{enabled:false}` based on `process.env.AIVERSE_ALLOW_IMPLEMENTER_RUNTIME_SPAWN`, and never includes any other environment value in the response.

### Implementation for User Story 2

- [ ] T015 [US2] Implement `GET /api/runtime/status` in `src/app/api/runtime/status/route.ts`. Must make T014 pass.
- [ ] T016 [US2] Surface the enablement state in the office UI: add a read-only "Real execution: Enabled/Not enabled on this machine" indicator to `OfficeProjectPortalView.ts` (and its probe/display data in `OfficeProjectPortalTypes.ts` if that pattern is already used for other read-only state, per existing convention), sourced by fetching `/api/runtime/status` once per office entry. Add/extend a `OfficeProjectPortalView.test.ts` case for the new indicator's rendering given each enablement state.
- [ ] T017 [US2] Confirm (extend T007's route test) that a `refused`/`not_enabled` response from `POST /api/runtime/execute` is rendered by the existing controller/view code path as a distinct, honest status — not merged visually with `Blocked` in a way that would hide which is which.

**Checkpoint**: Both P1 stories work together — real runs execute when enabled, and the operator can always tell whether they will.

---

## Phase 5: User Story 3 - Failures Are Honest and Never Leave a Mess (Priority: P2)

**Goal**: Timeout, crash, and operator-cancel all resolve to an honest terminal status with no orphaned process.

**Independent Test**: Using the fake process runner's controllable timers/handles from T003, force each of the three paths and assert the reported status and that `cancel()`/the timeout path actually requests process shutdown.

### Tests for User Story 3

- [ ] T018 [P] [US3] Write `src/app/api/runtime/execute/[runId]/route.test.ts` first: `DELETE` on a known in-flight `runId` calls through to `RuntimeBridgeProcessRunner.cancel()` and returns `{accepted:true}`; on an unknown/already-terminal `runId` returns `{accepted:false}` without error.
- [ ] T019 [P] [US3] Extend T007's route test with: a run whose fake process runner reports `timedOut: true` resolves as `timed_out` (not `completed`); a run whose fake process exits non-zero resolves as `failed` with captured evidence; a second concurrent request for the same `projectId` while the first is `running` resolves as `refused`/`already_running`.

### Implementation for User Story 3

- [ ] T020 [US3] Implement `DELETE /api/runtime/execute/[runId]/route.ts`, looking up the run in `RuntimeBridgeRunRegistry` and delegating to the handle's `cancel()` from T004. Must make T018 pass. (depends on T006)
- [ ] T021 [US3] Confirm (should already hold from T004/T009, add any missing assertions) that the registry removes a project's active-run entry as soon as it reaches any terminal status, so a subsequent request for that project is never wrongly refused `already_running` after the prior run actually finished.

**Checkpoint**: All three user stories are independently functional and covered by fakes-only tests.

---

## Phase 6: Polish & Validation

- [ ] T022 [P] Add a brief "Real Execution Server Bridge" subsection to `docs/roadmap.md` Phase 3 noting this feature's scope and that GitHub write access / new-project design remain separately specified, out of scope here (per spec.md's Assumptions).
- [ ] T023 Run the full existing suite plus the new tests: `npm test`.
- [ ] T024 `npx tsc --noEmit`.
- [ ] T025 `npm run build`.
- [ ] T026 `git diff --check` and `git diff --cached --check`.
- [ ] T027 Walk through `quickstart.md` manually on this machine with a disposable scratch project and a real CLI install — this is the one verification the automated test suite cannot do (an actual real subprocess), and is required before this feature can be considered genuinely proven, not just believed correct from fakes.

---

## Dependencies & Execution Order

- Phase 1 before all phases.
- Phase 2 (Foundational) blocks every user story — T004 and T006 are depended on by Phase 3, 4, and 5 implementation tasks.
- Phase 3 (US1) and Phase 4 (US2) can proceed in parallel once Phase 2 is done; both are P1 and together form the MVP.
- Phase 5 (US3) depends on T004's `cancel()` handle (Foundational) and on T009's route existing (US1), since the cancel route and the concurrency-refusal assertions sit on top of the same route and registry.
- Phase 6 depends on all prior phases.

## Implementation Strategy

**MVP first**: Phases 1 → 2 → 3 → 4 (both P1 stories) → stop and manually verify via quickstart.md's "real run end to end" and "not enabled" sections before adding Phase 5's cancel/timeout polish. Phase 5 adds real safety value (no orphaned process, honest cancel) but the P1 stories already deliver the feature's core promise: real execution instead of permanent `Blocked`.
