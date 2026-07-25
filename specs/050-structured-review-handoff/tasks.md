# Tasks: Structured Review Handoff

**Input**: Design documents from `specs/050-structured-review-handoff/`

**Prerequisites**: spec.md, plan.md, research.md, data-model.md, contracts/

**Tests**: Required. Use deterministic fixtures and mock runners; do not call live Codex or Claude from automated tests.

## Phase 1: Setup

**Purpose**: Align Spec Kit pointers and inspect reusable workflow helpers.

- [X] T001 Inspect `tools/agent-workflow/orchestrateCommand.js`, `reviewCommand.js`, `agentWorkflow.js`, `agentRunner.js`, `cli.js`, templates, README, and Spec 049 docs
- [X] T002 Create `specs/050-structured-review-handoff/` with complete Spec Kit docs
- [X] T003 Update `.specify/feature.json` and managed agent context pointer for Spec 050

---

## Phase 2: User Story 1 - Capture Structured Reviewer Decisions (Priority: P1)

**Goal**: Parse, validate, reconcile, and persist structured review objects while preserving raw Markdown.

**Independent Test**: Fixture Reviewer outputs cover valid approval, valid changes requested, absent structured data, malformed JSON, unsupported versions, invalid decisions, invalid severities, duplicate IDs, multiple blocks, and unrelated JSON.

- [X] T004 [P] [US1] Add `tools/agent-workflow/structuredReview.test.ts` with parser, validator, and reconciliation cases
- [X] T005 [US1] Add `tools/agent-workflow/structuredReview.js` with pure extraction, validation, normalization, and reconciliation helpers
- [X] T006 [US1] Update `tools/agent-workflow/reviewCommand.js` to parse structured reviews, classify successful output through reconciliation, write valid structured JSON artifacts, and append structured metadata
- [X] T007 [US1] Extend `tools/agent-workflow/reviewCommand.test.ts` for structured artifacts, raw Markdown preservation, invalid structured data, and Markdown-only compatibility

---

## Phase 3: User Story 2 - Feed Structured Blocking Findings to Fix Prompts (Priority: P1)

**Goal**: Use valid structured blocking findings for deterministic Implementer fix prompts.

**Independent Test**: Mock orchestration returns structured Changes Requested and verifies the fix prompt contains exact structured fields and raw review artifact path.

- [X] T008 [P] [US2] Add orchestration tests for structured findings in fix prompts and non-actionable structured Changes Requested blocking
- [X] T009 [US2] Update `tools/agent-workflow/orchestrateCommand.js` to prefer valid structured blocking findings and retain Markdown fallback only when structured data is absent
- [X] T010 [US2] Persist latest structured review status, diagnostics, path, and normalized review in orchestration state

---

## Phase 4: User Story 3 - Conservative Failure and Compatibility (Priority: P2)

**Goal**: Preserve Spec 049 behavior and stop conservatively on invalid structured handoff.

**Independent Test**: Existing direct approval and fix-flow tests still pass; invalid/conflicting structured data blocks instead of reaching final verification.

- [X] T011 [P] [US3] Add tests for Markdown approval plus structured changes requested, Markdown changes requested plus structured approval, invalid structured data never reaching final verification, legacy state compatibility, dry-run no writes, Windows paths, and remote mutation safety
- [X] T012 [US3] Update `tools/agent-workflow/templates/independent-review.md` with the structured review output contract
- [X] T013 [US3] Update `tools/agent-workflow/README.md` with structured format, schema behavior, fallback behavior, conflict handling, artifact locations, blocked behavior, and PowerShell examples

---

## Phase 5: Validation and Commit

**Purpose**: Validate focused and full repository behavior before local commit.

- [X] T014 Run focused structured review and workflow tests
- [X] T015 Run `npm test`
- [X] T016 Run `npx tsc --noEmit`
- [X] T017 Run `npm run build`
- [X] T018 Run `git diff --check`
- [X] T019 Run `git diff --cached --check`
- [X] T020 Inspect `git status`, `git diff --stat`, and `git diff`
- [X] T021 Create one local commit without pushing or mutating GitHub state

## Dependencies & Execution Order

- Phase 1 before implementation.
- US1 before US2 and US3.
- US2 before structured fix prompt behavior can be complete.
- US3 before final validation.
- Phase 5 after implementation.

## Implementation Strategy

1. Build the pure parser and exhaustive fixture tests first.
2. Integrate structured parsing into independent review artifacts and classification.
3. Integrate structured findings into orchestration fix prompts.
4. Update prompt/docs and validate existing Spec 049 flows.
