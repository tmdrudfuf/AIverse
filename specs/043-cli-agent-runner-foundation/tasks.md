# Tasks: CLI Agent Runner Foundation

**Input**: Design documents from `specs/043-cli-agent-runner-foundation/`

## Phase 1: Review and Design

- [x] T001 Inspect Spec 042 `tools/agent-workflow` architecture.
- [x] T002 Verify current local CLI availability for Codex and Claude commands.
- [x] T003 Create Spec Kit artifacts for Spec 043.

## Phase 2: Runner Foundation

- [x] T004 Export safe run-record helpers from `tools/agent-workflow/agentWorkflow.js`.
- [x] T005 Add `tools/agent-workflow/agentRunner.js` with provider-neutral configs, detection, execution, timeout capture, remote-mutation refusal, and JSON run records.
- [x] T006 Extend `tools/agent-workflow/cli.js` with `detect-agent` and `run-agent` commands.
- [x] T007 Update `tools/agent-workflow/README.md` with runner usage and human-only gates.

## Phase 3: Tests

- [x] T008 Add tests for CLI detection installed/missing results.
- [x] T009 Add tests for successful Codex/Claude-style execution records.
- [x] T010 Add tests for non-zero, timeout, empty output, interrupted execution, and CLI not installed.
- [x] T011 Add tests for human-merge-decision refusal and remote-mutating command refusal before spawn.
- [x] T012 Add tests for path containment with `.`, `..`, empty, and unusual feature ids.
- [x] T013 Add tests confirming six-stage workflow preservation and human-only prompt safety.

## Phase 4: Validation

- [x] T014 Run `npm test`.
- [x] T015 Run `npx tsc --noEmit`.
- [x] T016 Run `npm run build`.
- [x] T017 Run `git diff --check`.
- [x] T018 Run `git diff --cached --check`.
- [x] T019 Confirm no product `src/` files changed, no push, and no PR creation.

## Dependencies

- Phase 1 before implementation.
- Phase 2 before Phase 3 tests can pass.
- Phase 4 after implementation/tests.
