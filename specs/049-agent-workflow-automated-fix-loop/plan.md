# Implementation Plan: Agent Workflow Automated Fix Loop

**Branch**: `codex/agent-workflow-automated-fix-loop` | **Date**: 2026-07-24 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/049-agent-workflow-automated-fix-loop/spec.md`

## Summary

Add a local-only `orchestrate` command to `tools/agent-workflow` that runs the configured Implementer, validation commands, independent Reviewer, bounded fix cycles, final validation, and stops at `human-merge-decision`. The implementation reuses the existing role-based runner resolution, safety checks, process adapter timeout cleanup, independent review prompt generation, decision parsing, and run-record storage.

## Technical Context

**Language/Version**: JavaScript CommonJS workflow tooling, TypeScript/Vitest tests

**Primary Dependencies**: Existing `agentWorkflow.js`, `agentRunner.js`, `reviewCommand.js`, `agentWorkflowRun.js`, Node.js built-ins

**Storage**: Existing gitignored `.agent-workflow/runs/<feature-id>/` plus optional orchestration state fields in the existing JSON state file

**Testing**: Vitest tests with injected process adapters and deterministic temporary repositories/state files

**Target Platform**: Local developer machines, including Windows PowerShell

**Project Type**: Local CLI workflow tooling inside a Next.js/Phaser repository

**Performance Goals**: Dry-run without subprocess latency; real orchestration bounded by per-command timeout and max fix cycles

**Constraints**: Local-only, no product `src/` changes, no automatic push/PR/merge/remote mutation, no live agent calls in tests, no new runtime dependencies

**Scale/Scope**: One command, one orchestration module, one Implementer prompt template, tests, and documentation

## Existing System Review

- `agentRunner.js` already resolves logical roles, checks unsafe commands, builds stdin/argument prompt invocations, and cleans up timed-out child processes.
- `agentWorkflow.js` already provides validation defaults, run-record path containment, BOM-tolerant state loading, state writing, and review decision parsing.
- `reviewCommand.js` already gathers git context, builds independent review prompts, resolves Implementer/Reviewer roles, records review artifacts, and classifies outcomes.
- `agentWorkflowRun.js` handles simple stage execution but does not validate between stages or automatically feed review findings into fix cycles.
- Smallest safe seam: add `orchestrateCommand.js` and `templates/orchestrate-implement.md`, reuse existing helpers, and wire one CLI command.

## Constitution Check

- Spec First: Pass. `spec.md` exists for this feature.
- Plan Before Code: Pass. This plan defines the tooling-only implementation before code changes.
- Tasks Gate Implementation: Pass once `tasks.md` exists.
- Preserve Application Stability: Pass. Planned changes stay in `tools/agent-workflow` and specs; no product `src/` files.
- Validation Is Required: Pass. Full validation suite and focused workflow tests are required.

## Project Structure

### Documentation

```text
specs/049-agent-workflow-automated-fix-loop/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- orchestrate-command.md
|-- checklists/
|   `-- requirements.md
`-- tasks.md
```

### Source Code

```text
tools/agent-workflow/
|-- orchestrateCommand.js
|-- orchestrateCommand.test.ts
|-- templates/orchestrate-implement.md
|-- cli.js
`-- README.md
```

## Phase 0 Research

See [research.md](./research.md).

## Phase 1 Design

See [data-model.md](./data-model.md), [contracts/orchestrate-command.md](./contracts/orchestrate-command.md), and [quickstart.md](./quickstart.md).

## Constitution Check Post-Design

- Spec First: Pass.
- Plan Before Code: Pass.
- Tasks Gate Implementation: Pass once `tasks.md` exists.
- Preserve Application Stability: Pass.
- Validation Is Required: Pass.

## Complexity Tracking

No constitution violations.
