# Tasks: Agent Workflow Independent Review

**Input**: Design documents from `specs/048-agent-workflow-independent-review/`

**Prerequisites**: plan.md, spec.md, quickstart.md

**Tests**: Required. This feature changes local workflow tooling and must use fake/injected process adapters for the Reviewer CLI; real temporary git repositories may be used for deterministic git-context assertions.

**Organization**: Tasks are grouped by user story to enable independent implementation and review.

## Phase 1: Setup

**Purpose**: Confirm the existing workflow seam and reusable helpers.

- [X] T001 Inspect `tools/agent-workflow/agentWorkflow.js`, `agentRunner.js`, `agentWorkflowRun.js`, `cli.js`, and `templates/review.md`
- [X] T002 Export `formatList` from `tools/agent-workflow/agentWorkflow.js` for reuse by the new prompt builder

---

## Phase 2: User Story 1 - Request an Independent Review With One Command (Priority: P1)

**Goal**: Add `run-review` (and `run-review --dry-run`) to `tools/agent-workflow/cli.js`, backed by a new `reviewCommand.js` module and `templates/independent-review.md`.

**Independent Test**: Focused tests prove repository-context gathering, prompt building, Reviewer resolution/safety checks, decision classification, dry-run no-spawn behavior, and run-artifact recording, all with mocked subprocess/process-adapter behavior for the Reviewer CLI.

- [X] T003 [P] [US1] Add `tools/agent-workflow/templates/independent-review.md` with logical-role terminology and the required decision/output format
- [X] T004 [US1] Implement `collectGitContext` (branch, base branch, merge base, staged/unstaged/committed diffs, changed-file summary) in `tools/agent-workflow/reviewCommand.js`
- [X] T005 [US1] Implement `buildIndependentReviewPrompt`, spec/AGENTS.md/CLAUDE.md inclusion with bounded truncation, in `tools/agent-workflow/reviewCommand.js`
- [X] T006 [US1] Implement `resolveRoleRunner`/`runnersMatch` (same-runner warning) and `previewIndependentReview`/`runIndependentReview`/`runIndependentReviewAndPersist` in `tools/agent-workflow/reviewCommand.js`
- [X] T007 [US1] Wire `run-review` and `run-review --dry-run` in `tools/agent-workflow/cli.js`, including the same-runner warning and next-action output
- [X] T008 [P] [US1] Add `tools/agent-workflow/reviewCommand.test.ts` covering: default/overridden/legacy/role-swapped Reviewer resolution, same-runner warning, staged-only/unstaged-only/committed-plus-working-tree/no-change git scenarios, Approved/Changes Requested/Unknown/Timed Out/Execution Failed classification, dry-run no-spawn, unsafe-command rejection before spawn, and run-artifact recording

---

## Phase 3: Documentation and Validation

**Purpose**: Keep local tooling docs and validation evidence current.

- [X] T009 Update `tools/agent-workflow/README.md` with the `run-review` command, its automatic behavior, the same-runner warning, and the optional `specPath`/`reviewRuns` state fields
- [X] T010 Update `AGENTS.md` with a pointer to `run-review` for independent-review requests
- [X] T011 Run `npm test`
- [X] T012 Run `npx tsc --noEmit`
- [X] T013 Run `npm run build`
- [X] T014 Run `git diff --check`
- [X] T015 Run `git diff --cached --check`
- [X] T016 Confirm no product `src/` files changed and no remote mutation occurred

## Dependencies & Execution Order

- Phase 1 before implementation.
- T003 can be written in parallel with T004-T006.
- T004 before T005; T005 before T006; T006 before T007.
- T008 after T003-T007 (tests exercise the finished module and CLI wiring).
- Phase 3 after User Story 1 implementation.

## Implementation Strategy

1. Complete setup and confirm reusable helpers (runner resolution, safety checks, run-record paths).
2. Add the template, then the git-context/prompt-building/runner-resolution module.
3. Wire the CLI command, matching the existing `run --dry-run` output conventions.
4. Add focused tests with mocked Reviewer subprocess behavior and real temporary git repositories for context assertions.
5. Validate with the full required suite.
6. Stop for live Implementer -> Reviewer workflow review before push or PR actions.
