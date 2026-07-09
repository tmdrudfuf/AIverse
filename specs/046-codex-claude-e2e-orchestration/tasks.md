# Tasks: Codex Claude E2E Orchestration

**Input**: Design documents from `/specs/046-codex-claude-e2e-orchestration/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Required. This feature changes local workflow automation and must use fake process adapters only.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Phase 1: Setup

**Purpose**: Align Spec Kit pointers and confirm the current workflow seam.

- [X] T001 Update `.specify/feature.json` to point at `specs/046-codex-claude-e2e-orchestration`
- [X] T002 Update `AGENTS.md` SPECKIT pointer to `specs/046-codex-claude-e2e-orchestration/plan.md`

---

## Phase 2: Foundational

**Purpose**: Add provider-neutral prompt delivery and review metadata support.

- [X] T003 Add prompt argument invocation support in `tools/agent-workflow/agentRunner.js`
- [X] T004 Add grounded review prompt fields and conservative decision parsing in `tools/agent-workflow/agentWorkflow.js`
- [X] T005 Update review and fix templates in `tools/agent-workflow/templates/review.md` and `tools/agent-workflow/templates/fix.md`

---

## Phase 3: User Story 1 - Run a Grounded Claude Review After Codex Implementation (Priority: P1)

**Goal**: Codex implementation and Claude review run through the same local workflow with safe default runner configuration.

**Independent Test**: Fake process adapter verifies Codex stdin implementation and Claude `-p` review invocation with review prompt grounding.

- [X] T006 [P] [US1] Add Codex stdin runner regression test in `tools/agent-workflow/agentRunner.test.ts`
- [X] T007 [P] [US1] Add Claude `-p` runner regression test in `tools/agent-workflow/agentRunner.test.ts`
- [X] T008 [US1] Set the default Claude review runner to `claude -p {{prompt}}` in `tools/agent-workflow/agentRunner.js`
- [X] T009 [US1] Preserve successful `Changes Requested` findings for fix prompts in `tools/agent-workflow/agentWorkflow.js`

---

## Phase 4: User Story 2 - Fail Safely on Unavailable or Unsafe Runners (Priority: P2)

**Goal**: Missing, unsafe, failed, or ambiguous runner output never advances as approval.

**Independent Test**: Fake process adapter verifies missing Claude, unsafe command rejection, malformed output, and no remote mutation.

- [X] T010 [P] [US2] Add unavailable Claude handling test in `tools/agent-workflow/agentRunner.test.ts`
- [X] T011 [P] [US2] Add malformed and ambiguous review output tests in `tools/agent-workflow/agentWorkflow.test.ts`
- [X] T012 [US2] Add integration-style fake adapter test for implement to review to fix preservation in `tools/agent-workflow/agentWorkflowRun.test.ts`

---

## Phase 5: Polish and Validation

**Purpose**: Complete validation and local commit.

- [X] T013 Run `npm test`
- [X] T014 Run `npx tsc --noEmit`
- [X] T015 Run `npm run build`
- [X] T016 Run `git diff --check`
- [X] T017 Run `git diff --cached --check`

---

## Phase 6: Live Smoke Parser Hardening

**Purpose**: Address the live Codex-to-Claude smoke-test blocker where real Claude markdown decisions were not always parsed as workflow decisions.

- [X] T018 Add conservative markdown review decision parsing for standalone bold decisions and `Review Decision:` heading forms in `tools/agent-workflow/agentWorkflow.js`
- [X] T019 Add focused parser regressions for bold decisions, `Review Decision:` heading forms, explanatory mentions, and mixed markdown decisions in `tools/agent-workflow/agentWorkflow.test.ts`

## Dependencies & Execution Order

- Phase 1 before implementation.
- Phase 2 before user story tests can pass.
- US1 before US2 integration assertions.
- Phase 5 after all implementation tasks.

## Notes

- Do not modify PR #35 or PR #36 branches.
- Do not modify product `src/` files.
- Do not duplicate PR #35's `detectAgentCli` safety fix.
- Do not push, open PRs, mark PRs ready, merge, or delete branches.
