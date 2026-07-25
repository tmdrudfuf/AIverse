# Tasks: Runtime Role Selection

**Input**: Design documents from `specs/053-runtime-role-selection/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Required by the specification for role resolution, CLI parsing, orchestration routing, resume continuity, runner safety, and dry-run behavior.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare feature pointers and inspect existing role-resolution seams.

- [x] T001 Update `.specify/feature.json` to `specs/053-runtime-role-selection`
- [x] T002 Update the SPECKIT pointer in `AGENTS.md` to `specs/053-runtime-role-selection/plan.md`
- [x] T003 [P] Inspect existing role resolution in `tools/agent-workflow/reviewCommand.js` (`resolveRoleRunner`) and `tools/agent-workflow/agentRunner.js` (`resolveAgentConfig`, `DEFAULT_STAGE_AGENTS`)
- [x] T004 [P] Inspect existing orchestration role usage in `tools/agent-workflow/orchestrateCommand.js`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add the pure role resolver before any command wiring depends on it.

- [x] T005 Add `enabled` flag (default `true`) to `normalizeAgentConfig` in `tools/agent-workflow/agentRunner.js`
- [x] T006 [P] Add `tools/agent-workflow/roleResolver.test.ts` covering resolution priority, roster auto-derivation, ambiguity, resume conflict, and determinism
- [x] T007 Implement `resolveEffectiveRoles`/`describeEffectiveRoles`/`getRoleRoster` in `tools/agent-workflow/roleResolver.js`

---

## Phase 3: User Story 1 - Pick the Implementer for One Run (Priority: P1) MVP

**Goal**: `orchestrate --implementer <id>` resolves the opposite Reviewer without editing state.

**Independent Test**: `orchestrate --implementer claude --dry-run` and `--implementer codex --dry-run` each print the correct opposite Reviewer and role source, spawn nothing, and leave state untouched.

- [x] T008 [P] Add dry-run and real-execution role-selection tests in `tools/agent-workflow/orchestrateCommand.test.ts`
- [x] T009 Integrate `resolveEffectiveRoles` into `previewOrchestration` and `runOrchestration` in `tools/agent-workflow/orchestrateCommand.js`
- [x] T010 Thread resolved implementer/reviewer ids through implement/fix, answer-questions, and review/re-review/final-review stages in `tools/agent-workflow/orchestrateCommand.js`
- [x] T011 Fix `runReviewWithoutStateWrite` to accept an implementer override so review prompts show the actual configured Implementer
- [x] T012 Wire `--implementer` flag parsing (strict: reject missing/conflicting values before spawn) and `Resolved roles`/`Role source` output in `tools/agent-workflow/cli.js`

---

## Phase 4: User Story 2 - Resume Continuity (Priority: P1)

**Goal**: A resumed orchestration run keeps its originally resolved roles; a conflicting `--implementer` on resume is rejected before spawn.

**Independent Test**: A pinned in-progress run resumed without `--implementer`, or with a matching one, continues unchanged; resumed with a conflicting `--implementer`, it rejects before any process call and leaves persisted roles unchanged.

- [x] T013 [P] Add resume-continuity and conflicting-resume tests in `tools/agent-workflow/orchestrateCommand.test.ts`
- [x] T014 Persist `resolvedImplementerId`/`resolvedReviewerId`/`roleResolutionSource` under `state.orchestration` and `latestResolvedRoles`/`latestRoleResolutionSource` at top level in `tools/agent-workflow/orchestrateCommand.js`
- [x] T015 Derive `existingRunRoles` from non-terminal pinned state and pass to `resolveEffectiveRoles` in `tools/agent-workflow/orchestrateCommand.js`

---

## Phase 5: User Story 3 - Safe Validation Before Spawn (Priority: P1)

**Goal**: Unknown, disabled, unsafe, ambiguous, and same-agent role resolutions are all rejected before any process spawn.

**Independent Test**: Each invalid `--implementer` scenario (unknown agent, disabled agent, unsafe runner, no distinct Reviewer, ambiguous multi-agent roster) is rejected with a diagnostic naming the requested Implementer and available eligible agents, with zero process-adapter calls.

- [x] T016 [P] Add validation-failure tests (unknown/disabled/unsafe/no-candidate/ambiguous) in `tools/agent-workflow/roleResolver.test.ts` and `tools/agent-workflow/orchestrateCommand.test.ts`
- [x] T017 Ensure runner safety checks (Spec 045 `assertSafeCommand`) run against the actually-resolved Implementer and Reviewer before any spawn in `tools/agent-workflow/roleResolver.js`
- [x] T018 Add `--implementer` support to `run-review` (auto-derive Reviewer only when `--agent` absent) in `tools/agent-workflow/reviewCommand.js` and `tools/agent-workflow/cli.js`
- [x] T019 Add `--implementer` support to `run` (stage-role-aware) and `detect-agent` (pair probing) in `tools/agent-workflow/cli.js`
- [x] T020 [P] Add `tools/agent-workflow/cli.test.ts` covering missing-value rejection, repeated-conflicting rejection, repeated-identical normalization, and `detect-agent`/`run` role wiring

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, validation, smoke tests, independent review, and local commit.

- [x] T021 Update `tools/agent-workflow/README.md` with `--implementer`, role-resolution priority, resume behavior, dry-run examples, two-agent/multi-agent behavior
- [x] T022 Run focused tests: `roleResolver`, `cli`, `orchestrateCommand`, `reviewCommand`, `agentRunner`
- [x] T023 Run full validation: `npm test`, `npx tsc --noEmit`, `npm run build`, `git diff --check`, `git diff --cached --check`
- [x] T024 Run required dry-run smoke checks for both `--implementer claude` and `--implementer codex`
- [x] T025 Run mock-runner Smoke A (Claude implements/Codex reviews) and Smoke B (Codex implements/Claude reviews)
- [x] T026 Run mock-runner Smoke C (Reviewer questions + fix cycle routed through resolved roles)
- [x] T027 Run mock-runner Smoke D (conflicting resume rejected before spawn, no state corruption)
- [x] T028 Request configured Codex CLI independent review using `run-review --implementer claude`
- [x] T029 Address any valid blocking review findings and rerun focused/full validation and relevant smoke tests
- [x] T030 Stage intended files, run `git diff --cached --check`, and commit with `feat: add runtime implementer selection`

---

## Dependencies & Execution Order

### Phase Dependencies

- Phase 1 setup must complete before implementation.
- Phase 2 (role resolver) blocks all user stories.
- User Story 1 (P1) is the MVP and must land before User Stories 2 and 3, which extend the same call sites.
- User Story 2 (resume) depends on User Story 1's orchestration integration.
- User Story 3 (validation/other commands) depends on the Phase 2 resolver but is otherwise independent of User Story 2.
- Polish depends on all user stories.

### Parallel Opportunities

- T003/T004 can run in parallel.
- T006 can be drafted while `orchestrateCommand.js` role usage is inspected.
- T016/T020 (validation-failure and CLI-parsing tests) can be written in parallel once the resolver contract is fixed.

## Implementation Strategy

### MVP First

1. Complete Phase 1 and Phase 2.
2. Implement User Story 1: `orchestrate --implementer <id>` resolves and uses the opposite Reviewer.
3. Validate focused tests.

### Incremental Delivery

1. Add resume pinning and conflict rejection.
2. Add validation-failure coverage and extend `--implementer` to `run-review`/`run`/`detect-agent`.
3. Complete docs, full validation, smoke tests, independent review, and commit.
