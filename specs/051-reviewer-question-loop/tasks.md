# Tasks: Reviewer Question Loop

**Input**: Design documents from `specs/051-reviewer-question-loop/`

**Prerequisites**: spec.md, plan.md, research.md, data-model.md, contracts/

**Tests**: Required. Use deterministic mock runners and fixtures; do not call live Codex or Claude from automated tests.

## Phase 1: Setup

**Purpose**: Align Spec Kit pointers and verify reusable workflow seams.

- [X] T001 Inspect `tools/agent-workflow/orchestrateCommand.js`, `reviewCommand.js`, `structuredReview.js`, `agentWorkflow.js`, `agentRunner.js`, prompt templates, and tests
- [X] T002 Create `specs/051-reviewer-question-loop/` with complete Spec Kit docs
- [X] T003 Update `.specify/feature.json` and `AGENTS.md` pointer for Spec 051

---

## Phase 2: User Story 1 - Clarification Round to Approval (Priority: P1)

**Goal**: Parse structured questions, answer them once, run final review, and reach approval.

**Independent Test**: Mock Reviewer asks one valid question, Implementer answers it, final Reviewer approves, validation passes, and workflow reaches `human-merge-decision`.

- [X] T004 [P] [US1] Extend question parsing and consistency tests in `tools/agent-workflow/structuredReview.test.ts`
- [X] T005 [US1] Extend `tools/agent-workflow/structuredReview.js` for `decision: "questions"` and question validation
- [X] T006 [P] [US1] Add `tools/agent-workflow/structuredAnswers.test.ts`
- [X] T007 [US1] Add `tools/agent-workflow/structuredAnswers.js`
- [X] T008 [US1] Add `tools/agent-workflow/templates/orchestrate-answer-questions.md`
- [X] T009 [US1] Add `tools/agent-workflow/templates/orchestrate-final-review.md`
- [X] T010 [US1] Add one-question approval flow tests in `tools/agent-workflow/orchestrateCommand.test.ts`
- [X] T011 [US1] Implement `answer-questions` and `final-review` orchestration stages in `tools/agent-workflow/orchestrateCommand.js`

---

## Phase 3: User Story 2 - Clarification Then Existing Fix Cycle (Priority: P1)

**Goal**: Ensure final Changes Requested after answers enters the existing fix path without consuming question cycles as fix cycles.

**Independent Test**: Mock final Reviewer returns valid Changes Requested after answers; workflow enters fix, increments only `fixCycleCount`, and uses structured blocking findings.

- [X] T012 [P] [US2] Add final Changes Requested and fix-count tests in `tools/agent-workflow/orchestrateCommand.test.ts`
- [X] T013 [US2] Reuse structured finding handoff after final review in `tools/agent-workflow/orchestrateCommand.js`

---

## Phase 4: User Story 3 - Conservative Failure and Resume (Priority: P2)

**Goal**: Stop safely on invalid questions, invalid answers, repeated questions, timeouts, unsafe runners, and resume scenarios.

**Independent Test**: Fixtures and mock runners cover malformed/mixed decisions, unsafe questions, invalid answers, repeated final questions, answer/final-review timeouts, role swap, BOM state, and resume.

- [X] T014 [P] [US3] Add invalid question tests in `tools/agent-workflow/structuredReview.test.ts`
- [X] T015 [P] [US3] Add invalid answer tests in `tools/agent-workflow/structuredAnswers.test.ts`
- [X] T016 [P] [US3] Add orchestration failure/resume/role-swap/timeout tests in `tools/agent-workflow/orchestrateCommand.test.ts`
- [X] T017 [US3] Implement safe blocking and resume state updates in `tools/agent-workflow/orchestrateCommand.js`
- [X] T018 [US3] Update dry-run preview and CLI output in `tools/agent-workflow/cli.js`

---

## Phase 5: Documentation and Validation

**Purpose**: Document behavior, validate locally, smoke test, review, and commit.

- [X] T019 Update `tools/agent-workflow/templates/independent-review.md`
- [X] T020 Update `tools/agent-workflow/README.md`
- [X] T021 Run focused structured review, structured answer, review command, and orchestration tests
- [X] T022 Run `npm test`
- [X] T023 Run `npx tsc --noEmit`
- [X] T024 Run `npm run build`
- [X] T025 Run `git diff --check`
- [X] T026 Run `git diff --cached --check`
- [X] T027 Run standard and role-swapped `orchestrate --dry-run`
- [X] T028 Run mock-runner E2E question-loop smoke
- [X] T029 Run one bounded configured Claude CLI independent review
- [X] T030 Commit locally without pushing or mutating GitHub state

## Dependencies & Execution Order

- Phase 1 before implementation.
- US1 before US2 and US3.
- US2 before final Changes Requested behavior is complete.
- US3 before final validation.
- Phase 5 after implementation.

## Implementation Strategy

1. Extend structured review parsing and tests.
2. Add structured answer parsing and tests.
3. Add answer/final-review stages and templates.
4. Add failure, resume, role-swap, and timeout coverage.
5. Validate, smoke test, independent review, and commit.
