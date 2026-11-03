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
- [ ] T005 [P] Write `src/app/api/runtime/_lib/RuntimeBridgeRunRegistry.test.ts` first, covering: only one active run per normalized working-directory key (second concurrent request is refused `already_running`), and that a terminal run's record is written to `.agent-workflow/real-runs/<runId>.json` with the fields from data-model.md's `RunAuditRecord` (depends on T002).
- [ ] T006 Implement `src/app/api/runtime/_lib/RuntimeBridgeRunRegistry.ts` — the in-memory `Map<workingDirectoryKey, RunHandle>` concurrency guard plus the audit-file writer. There is no server-side project id (Spec 137's registry has no server-side counterpart); the normalized working directory itself is the key. Must make T005 pass. (depends on T004 for the run handle shape)

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
- [ ] T012 [US1] In `OfficeProjectPortalController.ts`, swap every `new ClaudeImplementerRuntimeProvider()` / `new CodexReviewerRuntimeProvider()` construction site (there are five: `implementerRuntimeService`, `reviewerRuntimeService`, the `ImplementerReviewFixRuntimeProvider` wrapper, `externalProjectAdosExecutionService`, and the two lazy `??=` fallbacks) to construct `ServerBridgeImplementerRuntimeProvider`/`ServerBridgeReviewerRuntimeProvider` instead. (Corrected from the original plan draft, which named `OfficeProjectPortalRegistry.ts`'s `createLinkedServices` — that function only returns placeholder display objects and does not construct these providers at all; the real construction sites are in the controller.) (depends on T010, T011)
- [ ] T013 [US1] Update/extend `OfficeProjectPortalController.implementer-runtime.test.ts` and `OfficeProjectPortalController.reviewer-runtime.test.ts` to assert the controller's default-wired service now resolves to the server-bridge providers (same assertions these tests already make about the controller's own default-wired service, per the `testHelpers.ts` convention already used there).

**Checkpoint**: User Story 1 is independently functional — an approved run reaches a real `fetch`-mediated terminal status, verifiable entirely with fakes (no real CLI needed yet).

---

## Phase 4: User Story 2 - Real Execution Is an Explicit, Visible Choice (Priority: P1)

**Goal**: The operator can always see whether real execution is enabled on this machine, and it is never silently on.

**Independent Test**: With enablement faked both ways in tests, `GET /api/runtime/status` reports the correct boolean and the office UI reflects it.

### Tests for User Story 2

- [X] T014 [P] [US2] Write `src/app/api/runtime/status/route.test.ts` first: returns both `implementerEnabled`/`reviewerEnabled` (two independent env vars, not one combined flag -- corrected from the original draft during T007's implementation), and never includes any other environment value in the response.

### Implementation for User Story 2

- [X] T015 [US2] Implement `GET /api/runtime/status` in `src/app/api/runtime/status/route.ts`. Must make T014 pass.
- [X] T016 [US2] Data layer done: `OfficeProjectPortalController.getRuntimeBridgeEnablement()`/`refreshRuntimeBridgeEnablement()` fetch and cache `/api/runtime/status`, explicitly opt-in (never auto-called from the constructor, so no existing test gains an implicit network call), tested in `OfficeProjectPortalController.runtime-bridge-enablement.test.ts`. ponytail: the actual DOM label in `CompanyOfficeScene.ts`/`OfficeProjectPortalView.ts` (and wiring the refresh call to "on office entry") is deferred — that file is ~3000+ lines this implementation pass did not read in full, and a blind edit there carries real risk for a visibility nicety that the operator's stated goal (real execution actually working) does not depend on. Add when: a follow-up reads `CompanyOfficeScene.ts`'s existing `syncProjectBacklogForm`/probe-rendering pattern (see its `Auto Suggestions`/`autonomyReason` labels for the exact style to mirror) and adds one more such label backed by this already-tested getter.
- [X] T017 [US2] Each refusal reason (`not_enabled`/`project_unavailable`/`already_running`/`unsafe_command`) now carries its own distinct, human-readable `evidence.stderrSummary` message (`REFUSAL_MESSAGES` in `route.ts`), asserted in `route.test.ts` — so a refusal is never visually indistinguishable from another, or from a genuine `Blocked` evidence message, once rendered.

**Checkpoint**: Both P1 stories work together — real runs execute when enabled, and the operator can always tell whether they will.

---

## Phase 5: User Story 3 - Failures Are Honest and Never Leave a Mess (Priority: P2)

**Goal**: Timeout, crash, and operator-cancel all resolve to an honest terminal status with no orphaned process.

**Independent Test**: Using the fake process runner's controllable timers/handles from T003, force each of the three paths and assert the reported status and that `cancel()`/the timeout path actually requests process shutdown.

### Tests for User Story 3

- [X] T018 [P] [US3] Write `src/app/api/runtime/execute/[runId]/route.test.ts` first: `DELETE` on a known in-flight run (registered directly against the shared registry) calls through to its handle's `cancel()` and returns `{accepted:true}`; on an unknown `runId` returns `{accepted:false}` without error.
- [X] T019 [P] [US3] Already covered in `route.test.ts` (added alongside T007/T009): a genuinely timed-out real subprocess resolves as `timed_out`; a genuine non-zero exit resolves as `failed` with captured evidence; a second concurrent real request for the same working directory while the first is `running` resolves as `refused`/`already_running`.

### Implementation for User Story 3

- [X] T020 [US3] Implement `DELETE /api/runtime/execute/[runId]/route.ts`, looking up the run in `RuntimeBridgeRunRegistry` and delegating to the handle's `cancel()`. Must make T018 pass. (depends on T006)

  ponytail / scope boundary found while wiring this: cancelling requires knowing a run's `runId`
  *while it is still running*, but `POST /api/runtime/execute` only returns the `runId` once the run
  is already terminal (same call resolves once, at the end). The existing, already-reviewed
  `ImplementerRuntimeProvider`/`ReviewerRuntimeProvider` contracts are explicitly documented as
  "No mutation methods exist on this contract by design -- only a single, bounded, terminal
  invocation," so they offer no hook to learn or supply a run id before `invoke()` resolves either.
  Cancellation is therefore delivered and fully tested at the HTTP/registry layer (this route +
  `RuntimeBridgeRunRegistry`) but is **not yet reachable from the existing office UI** -- no "Cancel"
  button exists to call it from, because doing so would mean widening that deliberately minimal
  provider contract, which is a separate design decision this feature does not make silently.
  Add when: a future feature decides the contract should grow a cancel hook (e.g. the caller
  generates and supplies its own `runId` up front, as an idempotency key, instead of the server
  generating one only visible after completion) and wires an actual Cancel control to it.
- [X] T021 [US3] Confirmed via the "frees the working directory for a new run once the prior one finishes" case in `route.test.ts`: the registry removes the active-run entry as soon as a run reaches any terminal status, so a subsequent request for the same working directory is never wrongly refused `already_running`.

**Checkpoint**: All three user stories are independently functional and covered by fakes-only tests.

---

## Phase 6: Polish & Validation

- [X] T022 [P] Added a `docs/roadmap.md` Phase 3 note on this feature's scope and that GitHub write access / new-project design remain separately specified, out of scope here.
- [X] T023 `npm test`: 209 files / 2245 tests passing.
- [X] T024 `npx tsc --noEmit`: clean.
- [X] T025 `npm run build`: clean (also confirms the three `/api/runtime/*` routes compile as server-only dynamic routes with no client-bundle leakage).
- [X] T026 `git diff --check` / `git diff --cached --check`: clean.
- [ ] T027 Walk through `quickstart.md` manually on this machine with a disposable scratch project and a real CLI install — this is the one verification the automated test suite cannot do (an actual real subprocess) and genuinely spawns a real, consequential agent process against a real local path. **Deliberately left for the operator to run themselves** (not run by this implementation pass): it requires `AIVERSE_ALLOW_IMPLEMENTER_RUNTIME_SPAWN`/`AIVERSE_ALLOW_REVIEWER_RUNTIME_SPAWN` to be genuinely set and a real CLI call to actually fire, which is exactly the class of action `SPAWN_ALLOW_ENV_VAR`'s own existing safety comment warns an automated process should not do unsupervised.

---

## Dependencies & Execution Order

- Phase 1 before all phases.
- Phase 2 (Foundational) blocks every user story — T004 and T006 are depended on by Phase 3, 4, and 5 implementation tasks.
- Phase 3 (US1) and Phase 4 (US2) can proceed in parallel once Phase 2 is done; both are P1 and together form the MVP.
- Phase 5 (US3) depends on T004's `cancel()` handle (Foundational) and on T009's route existing (US1), since the cancel route and the concurrency-refusal assertions sit on top of the same route and registry.
- Phase 6 depends on all prior phases.

## Implementation Strategy

**MVP first**: Phases 1 → 2 → 3 → 4 (both P1 stories) → stop and manually verify via quickstart.md's "real run end to end" and "not enabled" sections before adding Phase 5's cancel/timeout polish. Phase 5 adds real safety value (no orphaned process, honest cancel) but the P1 stories already deliver the feature's core promise: real execution instead of permanent `Blocked`.
