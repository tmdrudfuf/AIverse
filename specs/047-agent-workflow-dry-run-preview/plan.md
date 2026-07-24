# Implementation Plan: Agent Workflow Dry Run Preview

**Branch**: `codex/agent-workflow-dry-run-preview-smoke` | **Date**: 2026-07-09 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/047-agent-workflow-dry-run-preview/spec.md`

## Summary

Add a local-only dry-run preview for the existing `tools/agent-workflow` `run` command. The preview should resolve the current stage and selected role/agent, generate the same prompt metadata used by real runs, show the command/prompt/run-directory preview, and stop without spawning the Implementer, Reviewer, or any configured agent and without recording stage results. This provides the first small production-code smoke task for the live Implementer -> Reviewer workflow after Spec 046.

## Technical Context

**Language/Version**: JavaScript CommonJS workflow tooling, TypeScript/Vitest tests

**Primary Dependencies**: Existing `tools/agent-workflow` modules, Node.js built-ins

**Storage**: Existing gitignored `.agent-workflow/runs/<feature-id>/`

**Testing**: Vitest tests with fake or injected adapters only

**Target Platform**: Local developer machines running the AIverse repository

**Project Type**: Local CLI workflow tooling inside a Next.js/Phaser app repository

**Performance Goals**: Dry-run preview completes without subprocess startup latency and without running live agents

**Constraints**: Local-only, no product `src/` changes, no external API calls, no credentials, no remote mutation, no automatic PR or merge actions, no live CLI calls in tests

**Scale/Scope**: One focused CLI preview improvement and focused tests, small enough for live Implementer -> Reviewer orchestration review

## Existing System Review

- Spec 044 added `run` and `--until-blocked` execution through `agentWorkflowRun.js`.
- Spec 045 documented configuration and dry-run/diagnostic expectations, but current `main` does not expose a `run --dry-run` preview path in `tools/agent-workflow/cli.js`.
- Spec 046 verified live role-based execution, review parsing, fix/re-review, and human-gate stopping with default Implementer = Codex CLI and Reviewer = Claude CLI.
- Smallest seam: add preview-only behavior near the `run` command path, reusing stage/agent resolution and prompt generation helpers without spawning the process adapter.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Spec First: Pass. `spec.md` exists for this feature.
- Plan Before Code: Pass. This plan defines the dry-run preview slice before implementation.
- Tasks Gate Implementation: Pass after `tasks.md` is generated.
- Preserve Application Stability: Pass. Planned changes stay in `tools/agent-workflow` and specs; no product app `src/` files.
- Validation Is Required: Pass. Full validation suite is required before any commit.

## Project Structure

### Documentation (this feature)

```text
specs/047-agent-workflow-dry-run-preview/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- dry-run-preview.md
|-- checklists/
|   `-- requirements.md
`-- tasks.md
```

### Source Code (repository root)

```text
tools/agent-workflow/
|-- agentWorkflowRun.js
|-- agentWorkflowRun.test.ts
|-- cli.js
```

**Structure Decision**: Extend the existing local workflow runner modules. Do not create a parallel orchestration system and do not modify product app `src/` files.

## Phase 0 Research

See [research.md](./research.md).

## Phase 1 Design

See [data-model.md](./data-model.md), [contracts/dry-run-preview.md](./contracts/dry-run-preview.md), and [quickstart.md](./quickstart.md).

## Constitution Check Post-Design

- Spec First: Pass.
- Plan Before Code: Pass.
- Tasks Gate Implementation: Pass once `tasks.md` exists.
- Preserve Application Stability: Pass; planned changes stay in `tools/agent-workflow` and specs.
- Validation Is Required: Pass; tasks include automated validation.

## Complexity Tracking

No constitution violations.
