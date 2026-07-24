# Implementation Plan: Agent Workflow Independent Review

**Branch**: `codex/agent-workflow-dry-run-preview-smoke` | **Date**: 2026-07-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/048-agent-workflow-independent-review/spec.md`

## Summary

Add a `run-review` command to the existing `tools/agent-workflow` CLI that automatically inspects the current repository (branch, base branch, merge base, staged/unstaged/committed diffs), builds a complete independent-review prompt from a new template, resolves and runs the configured logical Reviewer, classifies the outcome conservatively, records artifacts through the existing run-record system, and prints a concise decision and next action. This removes the remaining manual step (hand-writing a review prompt) from the Implementer -> Reviewer loop.

## Technical Context

**Language/Version**: JavaScript CommonJS workflow tooling, TypeScript/Vitest tests

**Primary Dependencies**: Existing `tools/agent-workflow` modules (`agentWorkflow.js`, `agentRunner.js`, `agentWorkflowRun.js`), Node.js built-ins (`child_process.execFileSync` for read-only git inspection)

**Storage**: Existing gitignored `.agent-workflow/runs/<feature-id>/`

**Testing**: Vitest tests with fake/injected process adapters for the Reviewer CLI, and real temporary git repositories for deterministic git-context assertions

**Target Platform**: Local developer machines running the AIverse repository

**Project Type**: Local CLI workflow tooling inside a Next.js/Phaser app repository

**Performance Goals**: Repository inspection and prompt build complete quickly using bounded diff/text sizes; no unbounded raw output embedded in prompts

**Constraints**: Local-only, no product `src/` changes, no external API/network calls, no credentials, no remote git mutation, no automatic PR/merge actions, no live CLI calls in tests, dry-run never spawns the Reviewer process

**Scale/Scope**: One new CLI command, one new prompt template, one new module (`reviewCommand.js`), focused tests, and minimal optional state fields (`specPath`, `reviewRuns`)

## Existing System Review

- Spec 043/044 added agent runner execution and the `run` command with role-based Implementer/Reviewer resolution (`agentRunner.js`, `agentWorkflowRun.js`).
- Spec 046 verified live Implementer -> Reviewer orchestration with default Implementer = Codex CLI, Reviewer = Claude CLI.
- Spec 047 added `run --dry-run` preview, reusing stage/agent resolution without spawning a process.
- The existing `review`/`re-review` stage prompts (`templates/review.md`) require the caller to have already populated `changedFiles`, `taskScope`, and `validationEvidence` in state by hand; there is no automatic git inspection anywhere in the tool.
- Smallest seam: add a new, independent code path (`reviewCommand.js` + `templates/independent-review.md`) that gathers git context itself and reuses `resolveAgentConfig`/`assertSafeCommand`/`createPromptInvocation`/`createDefaultProcessAdapter` from `agentRunner.js` and `createRunFilePath`/`readState`/`writeState`/`formatList`/safety constants from `agentWorkflow.js`, rather than overloading the fixed six-stage `generatePrompt` pipeline.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Spec First: Pass. `spec.md` exists for this feature.
- Plan Before Code: Pass. This plan defines the `run-review` slice before implementation.
- Tasks Gate Implementation: Pass after `tasks.md` is generated.
- Preserve Application Stability: Pass. Planned changes stay in `tools/agent-workflow` and specs; no product app `src/` files.
- Validation Is Required: Pass. Full validation suite is required before any commit.

## Project Structure

### Documentation (this feature)

```text
specs/048-agent-workflow-independent-review/
|-- spec.md
|-- plan.md
|-- tasks.md
`-- quickstart.md
```

### Source Code (repository root)

```text
tools/agent-workflow/
|-- reviewCommand.js
|-- reviewCommand.test.ts
|-- templates/independent-review.md
|-- cli.js
|-- agentWorkflow.js
`-- README.md
```

**Structure Decision**: Add a new module and template alongside the existing workflow files rather than modifying the fixed-stage prompt pipeline. `cli.js` gains one new command branch (`run-review`) following the existing `run --dry-run` pattern. `agentWorkflow.js` gains one additive export (`formatList`) for reuse; no existing exports change shape.

## Phase 0 Research

- Confirmed `git` read-only plumbing (`rev-parse`, `diff`, `log`, `status --porcelain`, `merge-base`) is sufficient to gather all required repository context without any network access or repository mutation.
- Confirmed the existing `detectDecision` heading/bold parser already supports `# Review Decision: Approved` / `# Review Decision: Changes Requested` headings at any heading level, so no changes to decision parsing were required.
- Confirmed `assertSafeCommand` (remote-mutating command rejection) and `createPromptInvocation` (stdin vs. argument delivery) are reusable as-is for the Reviewer resolved by `run-review`.

## Phase 1 Design

- **Data model**: see Key Entities in `spec.md` (Repository Context, Independent Review Prompt, Review Run Record). No new persistent schema beyond two optional state fields: `specPath` (string) and `reviewRuns` (array of `{ outcome, reviewerId, reviewerIdentity, implementerId, sameRunner, recordedAt, promptPath, executionPath, resultPath }`).
- **Contract**: see [quickstart.md](./quickstart.md) for the exact CLI invocations and expected output shape.
- **Template**: `tools/agent-workflow/templates/independent-review.md` uses only logical role terminology (Implementer/Reviewer) and the required `# Review Decision: ...` / `## Blocking Findings` / `## Non-Blocking Improvements` / `## Validation Performed` / `## Final Recommendation` output contract.

## Constitution Check Post-Design

- Spec First: Pass.
- Plan Before Code: Pass.
- Tasks Gate Implementation: Pass once `tasks.md` exists.
- Preserve Application Stability: Pass; planned changes stay in `tools/agent-workflow` and specs.
- Validation Is Required: Pass; tasks include automated validation.

## Complexity Tracking

No constitution violations.
