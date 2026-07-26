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

## Phase 7: Review-Discovered Corrections

**Purpose**: Fix defects found by independent Codex CLI review of `e533d77` and re-validate before merge readiness. See [plan.md](plan.md#review-discovered-corrections) for full defect descriptions.

- [x] T031 Fix `run-review --implementer` skipping validation when `--agent` is also supplied; always route the requested Implementer through `resolveEffectiveRoles()` in `tools/agent-workflow/reviewCommand.js`/`tools/agent-workflow/roleResolver.js`; add regression tests in `tools/agent-workflow/reviewCommand.test.ts` (commit `f503e2b`)
- [x] T032 Fix structured-review classification combining stdout+stderr; analyze stdout alone (falling back to combined text only when stdout is empty) in `tools/agent-workflow/agentRunner.js`, `tools/agent-workflow/orchestrateCommand.js`, `tools/agent-workflow/reviewCommand.js`, while still persisting combined output to the run artifact; add regression tests in `tools/agent-workflow/reviewCommand.test.ts`/`tools/agent-workflow/orchestrateCommand.test.ts` (commit `0a4122e`)
- [x] T033 Fix `run --implementer <id> --until-blocked` only applying the resolved role pair to the first step; thread the full `resolvedRoles` pair from `tools/agent-workflow/cli.js` through every step of `tools/agent-workflow/agentWorkflowRun.js` via `DEFAULT_STAGE_AGENTS` stage-to-role mapping; add regression test in `tools/agent-workflow/agentWorkflowRun.test.ts` (commit `fafbeac`)

---

## Phase 8: Documentation Integrity (Governance Follow-Up)

**Purpose**: Address a blocking PR #44 review finding: Spec 046 had been rewritten in place to describe later role-abstraction work that was not part of its original, already-shipped-and-merged scope, and Runtime Role Selection (this feature) needed its own complete, traceable Spec Kit trail rather than relying on a retroactively-edited historical spec.

- [x] T034 Identify the exact commit (`4524a33`, `feat: add independent agent review workflow`) that rewrote `specs/046-codex-claude-e2e-orchestration/*` to generalize Codex/Claude into Implementer/Reviewer terminology and add role-swap/multi-agent-extensibility requirements (FR-011/012/013) that were not part of Spec 046's original scope
- [x] T035 Restore `specs/046-codex-claude-e2e-orchestration/{spec,plan,tasks,quickstart,research,data-model,checklists/requirements,contracts/e2e-agent-orchestration}.md` to their historically accurate content as of `fb5571d` (the last legitimate Spec 046 fix commit, predating the `4524a33` rewrite), via `git checkout fb5571d -- specs/046-codex-claude-e2e-orchestration/`
- [x] T036 Add a `## Clarifications` section to `specs/053-runtime-role-selection/spec.md` capturing resolved design decisions (single-flag selection, two-agent/multi-agent Reviewer resolution, non-destructive CLI override, resume role pinning, legacy alias/provider-neutral id compatibility, `--agent` precedence, dry-run validation, human-only remote mutation)
- [x] T037 Document the three review-discovered corrections (T031-T033) and their FR traceability in `specs/053-runtime-role-selection/plan.md`
- [x] T038 Add this Traceability section mapping requirements to implementation files, test files, and task IDs in `specs/053-runtime-role-selection/tasks.md`
- [x] T039 Verify `.specify/feature.json` and the `AGENTS.md` SPECKIT pointer already target `specs/053-runtime-role-selection` (confirmed unchanged, no edit needed)
- [x] T040 Audit `git grep` for "046", "runtime role", "--implementer", "role ID", "role swap" across `AGENTS.md`, `CLAUDE.md`, `tools/agent-workflow/README.md`, and `specs/046-*`/`specs/047-*`/`specs/053-*` for statements that falsely attribute Spec 053 functionality to Spec 046 (none found beyond the restored Spec 046 content itself)
- [x] T041 Run full validation (`npm test`, `npx tsc --noEmit`, `npm run build`, `git diff --check`, `git diff --cached --check`) after the documentation-integrity fix
- [x] T042 Commit the documentation-integrity fix separately from feature/runtime work (`docs: restore spec history and trace runtime roles`), push `codex/runtime-role-selection`, and request a fresh independent Codex CLI review of the new PR head

---

## Traceability

Requirement → implementation file → test file → task ID:

| Requirement | Implementation | Test(s) | Task(s) |
|---|---|---|---|
| FR-001/FR-016 CLI `--implementer` parsing, missing/repeated-value handling | `tools/agent-workflow/cli.js` (`parseImplementerFlag`) | `cli.test.ts`: "rejects a missing value...", "rejects repeated conflicting values", "normalizes repeated identical values to one value" | T012, T020 |
| FR-003 Role resolution priority (CLI override > state > default) | `tools/agent-workflow/roleResolver.js` (`resolveEffectiveRoles`) | `roleResolver.test.ts`: "resolves defaults when no state role override exists", "resolves state-configured roles when stageAgents overrides exist", "resolves --implementer claude/codex to..." | T007, T009 |
| FR-002/FR-007 Automatic opposite-Reviewer selection; multi-agent ambiguity handling | `tools/agent-workflow/roleResolver.js` (`getRoleRoster`, `resolveEffectiveRoles`) | `roleResolver.test.ts`: "defaults to codex/claude", "preserves an existing configured distinct Reviewer...", "rejects with an ambiguity diagnostic..." | T006, T007, T016 |
| FR-004 CLI override does not rewrite state | `tools/agent-workflow/orchestrateCommand.js` (`previewOrchestration`/`runOrchestration`) | `orchestrateCommand.test.ts` dry-run role-selection tests (T008) | T008, T009 |
| FR-005/FR-006 Reject unknown/disabled/unsafe/same-agent Implementer before spawn | `tools/agent-workflow/roleResolver.js` (`assertSafeCommand` integration) | `roleResolver.test.ts`: "rejects an unknown requested implementer...", "rejects a disabled requested implementer", "rejects an unsafe requested implementer runner...", "rejects when no distinct Reviewer candidate exists..." | T016, T017 |
| FR-008 Persisted run-level effective roles | `tools/agent-workflow/orchestrateCommand.js` (`state.orchestration`, `latestResolvedRoles`) | `orchestrateCommand.test.ts` resume-continuity tests (T013) | T014 |
| FR-009/FR-010 Resume continuity; conflicting-resume rejection; no cross-run leakage | `tools/agent-workflow/orchestrateCommand.js` (`existingRunRoles` derivation) | `roleResolver.test.ts`: "preserves pinned roles when no override is supplied", "accepts a matching --implementer on resume", "rejects a conflicting --implementer on resume before spawn" | T013, T015 |
| FR-011 Dry-run full validation, no spawn/state/artifacts | `tools/agent-workflow/orchestrateCommand.js` (`previewOrchestration`) | `orchestrateCommand.test.ts` dry-run tests; quickstart.md step 2/4 | T008, T024 |
| FR-012/FR-014 Effective-role propagation through every stage, including multi-step `run --until-blocked` | `tools/agent-workflow/orchestrateCommand.js` (stage routing), `tools/agent-workflow/agentWorkflowRun.js` (`resolvedRoles` step mapping), `tools/agent-workflow/cli.js` | `orchestrateCommand.test.ts` (T010); `agentWorkflowRun.test.ts`: "threads a resolved --implementer role pair through every step, not just the first" | T010, T033 |
| FR-013 Prompt/artifact identity accuracy | `tools/agent-workflow/reviewCommand.js` (`runReviewWithoutStateWrite` implementer override) | `orchestrateCommand.test.ts`/`reviewCommand.test.ts` (T011) | T011 |
| FR-005 (run-review validation gap) | `tools/agent-workflow/reviewCommand.js`, `tools/agent-workflow/roleResolver.js` | `reviewCommand.test.ts`: "rejects a disabled --implementer before any spawn even when --agent is also supplied", "rejects an unsafe --implementer before any spawn even when --agent is also supplied" | T031 |
| FR-015 Structured-review stdout-only parsing (regression fix) | `tools/agent-workflow/agentRunner.js`, `tools/agent-workflow/orchestrateCommand.js`, `tools/agent-workflow/reviewCommand.js` | `orchestrateCommand.test.ts`/`reviewCommand.test.ts`: "classifies a clean single structured review in stdout as valid/Approved even when stderr echoes duplicate example JSON blocks" | T032 |
| FR-016 Legacy `codex`/`claude` alias compatibility | `tools/agent-workflow/roleResolver.js`, `tools/agent-workflow/agentRunner.js` (`DEFAULT_STAGE_AGENTS`) | `roleResolver.test.ts`: "defaults to codex/claude"; `cli.test.ts` role-labeling tests | T005, T007 |
| Explicit `--agent` precedence on `run-review` | `tools/agent-workflow/reviewCommand.js` (`resolveReviewRoles`) | `reviewCommand.test.ts` `--implementer`+`--agent` tests | T018, T031 |
| Human-only remote mutation boundary (unchanged) | `tools/agent-workflow/agentRunner.js` (`assertSafeCommand`), `tools/agent-workflow/cli.js` | Existing Spec 045 safety tests (unmodified) | T017 |

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
