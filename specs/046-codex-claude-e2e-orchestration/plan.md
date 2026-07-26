# Implementation Plan: Codex Claude E2E Orchestration

**Branch**: `codex/codex-claude-e2e-orchestration` | **Date**: 2026-07-09 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/046-codex-claude-e2e-orchestration/spec.md`

## Summary

Add the first real local Codex-to-Claude orchestration slice by extending the existing Spec 042-044 workflow runner. Codex remains the default implementation/fix runner. Claude becomes the default review/re-review runner using non-interactive `claude -p <prompt>` invocation. Review prompts become grounded with repository, branch, commit, scope, diff, validation, and safety information. Successful review findings are preserved for Codex fix prompts while failed or ambiguous executions do not advance the workflow.

## Technical Context

**Language/Version**: JavaScript CommonJS workflow tooling, TypeScript application tests through Vitest

**Primary Dependencies**: Existing `tools/agent-workflow` modules, Node.js `child_process`, `fs`, and `path`

**Storage**: Local JSON workflow state and run records under `.agent-workflow/runs/<feature-id>/`

**Testing**: Vitest tests using fake process adapters only

**Target Platform**: Local developer machines running the AIverse repository

**Project Type**: Local CLI workflow tooling inside a Next.js/Phaser app repository

**Performance Goals**: Prompt generation and fake-run tests complete within normal repository test timing; real CLI execution remains bounded by configured timeout

**Constraints**: Local-only, no product `src/` changes, no remote mutation, no automatic PR or merge actions, no live CLI calls in tests

**Scale/Scope**: One focused vertical slice covering implement -> review -> fix handoff state, not full production agent automation

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Spec First: Pass. `spec.md` exists for this feature.
- Plan Before Code: Pass. This plan defines the tooling-only approach before implementation.
- Tasks Gate Implementation: Pass after `tasks.md` is generated.
- Preserve Application Stability: Pass. No product `src/` files are planned.
- Validation Is Required: Pass. Full validation suite is required before commit.

## Project Structure

### Documentation (this feature)

```text
specs/046-codex-claude-e2e-orchestration/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- e2e-agent-orchestration.md
|-- checklists/
|   `-- requirements.md
`-- tasks.md
```

### Source Code (repository root)

```text
tools/agent-workflow/
|-- agentRunner.js
|-- agentRunner.test.ts
|-- agentWorkflow.js
|-- agentWorkflow.test.ts
|-- agentWorkflowRun.test.ts
|-- templates/
|   |-- fix.md
|   `-- review.md
```

**Structure Decision**: Extend the existing local workflow runner modules. Do not create a parallel orchestration system.

## Phase 0 Research

See [research.md](./research.md).

## Phase 1 Design

See [data-model.md](./data-model.md), [contracts/e2e-agent-orchestration.md](./contracts/e2e-agent-orchestration.md), and [quickstart.md](./quickstart.md).

## Constitution Check Post-Design

- Spec First: Pass.
- Plan Before Code: Pass.
- Tasks Gate Implementation: Pass once `tasks.md` exists.
- Preserve Application Stability: Pass; planned changes stay in `tools/agent-workflow` and specs.
- Validation Is Required: Pass; tasks include automated validation.

## Complexity Tracking

No constitution violations.
