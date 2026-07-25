# Tasks: Finding Lifecycle Tracking

**Input**: Design documents from `specs/052-finding-lifecycle-tracking/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Required by the specification for parser, state, orchestration, resume, and smoke behavior.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare lifecycle feature pointers and inspect existing seams.

- [x] T001 Update `.specify/feature.json` to `specs/052-finding-lifecycle-tracking`
- [x] T002 Update the SPECKIT pointer in `AGENTS.md` to `specs/052-finding-lifecycle-tracking/plan.md`
- [x] T003 [P] Inspect lifecycle-relevant parser tests in `tools/agent-workflow/structuredReview.test.ts`
- [x] T004 [P] Inspect lifecycle-relevant orchestration tests in `tools/agent-workflow/orchestrateCommand.test.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add lifecycle parser/normalizer contracts before orchestration consumes them.

- [x] T005 [P] Add lifecycle parser/normalizer tests in `tools/agent-workflow/findingLifecycle.test.ts`
- [x] T006 Add lifecycle parser/normalizer implementation in `tools/agent-workflow/findingLifecycle.js`
- [x] T007 Extend structured review parsing tests for optional `findingLifecycle` in `tools/agent-workflow/structuredReview.test.ts`
- [x] T008 Extend structured review parser to preserve optional lifecycle entries in `tools/agent-workflow/structuredReview.js`

---

## Phase 3: User Story 1 - Track Initial Findings (Priority: P1) MVP

**Goal**: Initial structured review findings are recorded as new and become active fix findings.

**Independent Test**: A valid initial Changes Requested review records finding history and starts a fix cycle.

- [x] T009 [P] Add initial finding-history orchestration tests in `tools/agent-workflow/orchestrateCommand.test.ts`
- [x] T010 Record initial structured findings as new history entries in `tools/agent-workflow/orchestrateCommand.js`
- [x] T011 Persist latest lifecycle status and active findings after initial review in `tools/agent-workflow/orchestrateCommand.js`
- [x] T012 Verify Markdown-only initial review compatibility in `tools/agent-workflow/orchestrateCommand.test.ts`

---

## Phase 4: User Story 2 - Classify Findings on Re-review (Priority: P1)

**Goal**: Re-review classifies prior findings and only active blockers drive fix cycles.

**Independent Test**: F1 resolved advances to final verification; F1 still_open starts the next fix; F1 resolved plus F2 new targets F2 only.

- [x] T013 [P] Add lifecycle resolution/still-open/new orchestration tests in `tools/agent-workflow/orchestrateCommand.test.ts`
- [x] T014 Apply lifecycle normalization to re-review and final-review results in `tools/agent-workflow/orchestrateCommand.js`
- [x] T015 Write normalized `*-finding-lifecycle.json` artifacts in `tools/agent-workflow/orchestrateCommand.js`
- [x] T016 Update fix prompt handoff to include only active open blocking findings in `tools/agent-workflow/orchestrateCommand.js`
- [x] T017 Update re-review and final-review prompts with previous finding history in `tools/agent-workflow/templates/independent-review.md` and `tools/agent-workflow/templates/orchestrate-final-review.md`

---

## Phase 5: User Story 3 - Stop on Invalid Lifecycle Data (Priority: P1)

**Goal**: Invalid lifecycle data never starts a fix cycle or reaches final verification.

**Independent Test**: Missing, duplicate, unknown, conflicting, and continuity-breaking lifecycle entries all block conservatively.

- [x] T018 [P] Add invalid lifecycle normalization tests in `tools/agent-workflow/findingLifecycle.test.ts`
- [x] T019 [P] Add invalid lifecycle orchestration tests in `tools/agent-workflow/orchestrateCommand.test.ts`
- [x] T020 Block Unknown/invalid lifecycle outcomes before fix or final verification in `tools/agent-workflow/orchestrateCommand.js`
- [x] T021 Preserve lifecycle diagnostics in state and review run records in `tools/agent-workflow/orchestrateCommand.js`

---

## Phase 6: User Story 4 - Preserve Question Loop Semantics (Priority: P2)

**Goal**: Lifecycle applies only to the final decision after clarification answers.

**Independent Test**: Re-review questions do not update lifecycle; final review with lifecycle does.

- [x] T022 [P] Add question-loop lifecycle tests in `tools/agent-workflow/orchestrateCommand.test.ts`
- [x] T023 Ensure `questions` outcomes defer lifecycle processing in `tools/agent-workflow/orchestrateCommand.js`
- [x] T024 Ensure final-review requires lifecycle when previous findings exist in `tools/agent-workflow/orchestrateCommand.js`

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, dry-run, validation, smoke, independent review, and local commit.

- [x] T025 Update lifecycle dry-run output in `tools/agent-workflow/cli.js` and `tools/agent-workflow/orchestrateCommand.js`
- [x] T026 Update workflow documentation in `tools/agent-workflow/README.md`
- [x] T027 Run focused lifecycle tests from `specs/052-finding-lifecycle-tracking/quickstart.md`
- [x] T028 Run full validation: `npm test`, `npx tsc --noEmit`, `npm run build`, `git diff --check`
- [x] T029 Run standard, role-swapped, and lifecycle-aware dry-run CLI checks
- [x] T030 Run mock E2E smoke for F1 resolved to Approved
- [x] T031 Run mock E2E smoke for F1 resolved plus F2 new active blocker
- [x] T032 Request configured Claude CLI independent review using `run-review`
- [x] T033 Address any valid blocking review findings and rerun validation/re-review
- [x] T034 Stage intended files, run `git diff --cached --check`, and commit with `feat: add finding lifecycle tracking`

---

## Dependencies & Execution Order

### Phase Dependencies

- Phase 1 setup must complete before implementation.
- Phase 2 lifecycle normalization blocks all user stories.
- User Stories 1, 2, and 3 are all P1 safety behavior and should be implemented in order.
- User Story 4 depends on User Story 2 lifecycle integration and existing Spec 051 question stages.
- Polish depends on all user stories.

### Parallel Opportunities

- T003/T004 can run in parallel.
- T005 can be drafted while orchestration tests are inspected.
- Invalid lifecycle parser and orchestration tests can be added in parallel once the model is known.

## Implementation Strategy

### MVP First

1. Complete Phase 1 and Phase 2.
2. Implement User Story 1: initial findings become active history.
3. Validate focused tests.

### Incremental Delivery

1. Add re-review lifecycle normalization and active fix selection.
2. Add invalid lifecycle blocking.
3. Add question-loop integration.
4. Complete docs, dry-runs, smoke tests, independent review, and commit.
