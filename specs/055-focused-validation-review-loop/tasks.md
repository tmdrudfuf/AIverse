# Tasks: Focused Validation Review Loop

**Input**: Design documents from `specs/055-focused-validation-review-loop/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Required by the specification for strategy/command resolution, phase selection, target computation, orchestrator integration, run-summary integration, dry-run safety, unsafe-command rejection, and backward compatibility.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Phase 1: Setup (Shared Infrastructure)

- [x] T001 Update `.specify/feature.json` to `specs/055-focused-validation-review-loop`
- [x] T002 Update the SPECKIT pointer in `AGENTS.md` to `specs/055-focused-validation-review-loop/plan.md`
- [x] T003 [P] Re-inspect `orchestrateCommand.js`'s validation-stage handling, `getValidationCommands`, `runValidationCommands`, `nextStageAfterCompleted`, `fixCycleCount` handling
- [x] T004 [P] Re-inspect `runSummary.js`/`runSummarySchema.js` validation-summary/humanGate computation this feature must extend

## Phase 2: Foundational (Blocking Prerequisites)

- [x] T005 Implement `tools/agent-workflow/validationPolicy.js`: `VALIDATION_STRATEGIES`, `DEFAULT_VALIDATION_STRATEGY`, `VALIDATION_TRIGGER_REASONS`, `resolveValidationPolicy`, `resolvePhaseForStage`, `commandsForPhase`, `computeValidationTarget`, `targetsMatch`
- [x] T006 [P] Add `tools/agent-workflow/validationPolicy.test.ts` covering strategy/command resolution precedence, phase selection rules, target computation and matching
- [x] T007 Implement `tools/agent-workflow/validationPhase.js`: additive-field normalization (`phase`, `triggerReason`, `target`) and legacy-record bucketing (`isFullPhaseRecord`/`isFocusedPhaseRecord`)
- [x] T008 [P] Add `tools/agent-workflow/validationPhase.test.ts` covering legacy-record interpretation
- [x] T009 Implement `tools/agent-workflow/validationPlan.js`: `buildValidationPlanPreview`, `isFinalValidationSatisfied`
- [x] T010 [P] Add `tools/agent-workflow/validationPlan.test.ts`

## Phase 3: User Story 1/3 - Focused Iteration + Backward-Compatible Default (Priority: P1)

- [x] T011 Wire `orchestrateCommand.js`'s `validate`/`revalidate`/`final-verification` handling to resolve phase/commands via `validationPolicy.js`/`validationPhase.js`, stamping `phase`/`triggerReason`/`target` on every `validationRuns` record
- [x] T012 Add `target` to every `reviewRuns` record in `runReviewWithoutStateWrite`
- [x] T013 [P] Add `orchestrateCommand.test.ts` coverage: focused-final-full runs focused at validate/revalidate and full at final-verification; full-every-cycle (default and explicit) reproduces legacy behavior; unconfigured focused commands fall back to full

## Phase 4: User Story 2 - Full Validation Is the Only Readiness Gate (Priority: P1)

- [x] T014 Add `fullValidationFixCycleCount` and the `final-verification`-failure/tree-modification → `fix` routing in `orchestrateCommand.js`, capped by `maxFixCycles`, distinct from `fixCycleCount`
- [x] T015 [P] Add `orchestrateCommand.test.ts` coverage: full-validation failure routes to fix (not hard block) until the ceiling, then hard-blocks; full-validation modifying the tree is treated identically
- [x] T016 Update `runSummary.js`: `validation.status` mirrors the full phase; add `validation.focused`/`validation.full`/`validation.finalReadinessSatisfied`; add `commits.reviewedTarget`/`fullValidationTarget`/refined `exactCommitMatch`
- [x] T017 [P] Add `runSummary.test.ts` coverage: focused-only-passed never reports aggregate `"passed"`; `humanGate.ready` false until full passes with exact target match

## Phase 5: User Story 4 - Audit Trail (Priority: P2)

- [x] T018 Update `runSummaryRenderer.js`: strategy/focused/full lines, never a bare `Validation: Passed` unless full passed
- [x] T019 [P] Add `runSummaryRenderer.test.ts` coverage

## Phase 6: User Story 5 - Dry-Run Preview + CLI Wiring (Priority: P3)

- [x] T020 Add CLI flags to `cli.js`: `--validation-strategy`, `--focused-validation-command` (repeatable), `--full-validation-command` (repeatable), `--force-full-validation`; wire into `previewOrchestration`/`runOrchestration` options
- [x] T021 Update `formatOrchestrationDryRun` to print strategy/command lists/next phase, defensively tolerating preview objects without the new fields
- [x] T022 [P] Add `cli.test.ts` coverage for the new flags and dry-run output

## Phase 7: Cross-Cutting Safety & Compatibility

- [x] T023 [P] Add regression tests proving unsafe focused and unsafe full commands are rejected before spawn
- [x] T024 [P] Add regression tests proving `--skip-validation` still makes readiness unreachable
- [x] T025 [P] Add regression tests proving resumed runs at a terminal stage never re-run validation
- [x] T026 [P] Add regression tests proving old state files / legacy `validationRuns` records without `phase` remain valid and bucket as `full`
- [x] T027 [P] Confirm existing Spec 045/048/049/050/051/052/053/054 focused tests remain green unmodified

## Phase 8: Smoke Tests (Deterministic Mock Runners)

- [x] T028 Smoke A: multiple fixes, one full validation
- [x] T029 Smoke B: full validation catches hidden regression, fix remains possible, must re-run after fix
- [x] T030 Smoke C: resume preserves strategy/roles/attempt history, no duplication
- [x] T031 Smoke D: full-every-cycle backward compatibility
- [x] T032 Smoke E: dry-run previews both command lists, spawns/writes nothing

## Phase 9: Documentation & Final Validation

- [x] T033 Update `tools/agent-workflow/README.md`: strategies, commands, CLI options, defaults, fallback, dry-run, resume, exact-head validation, high-risk flag, summary integration, human readiness
- [x] T034 Run full `npm test`, `npx tsc --noEmit`, `npm run build`, `git diff --check`, `git diff --cached --check`
- [x] T035 Request independent Codex review (Implementer: Claude) and complete the fix cycle to Approved with zero blocking findings
- [x] T036 Local commit and final report
