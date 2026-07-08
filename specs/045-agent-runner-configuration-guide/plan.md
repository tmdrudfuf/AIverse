# Implementation Plan: Agent Runner Configuration and Real CLI Usage Guide

**Branch**: `045-agent-runner-configuration-guide` | **Date**: 2026-07-08 | **Spec**: `specs/045-agent-runner-configuration-guide/spec.md`

**Input**: Feature specification from `specs/045-agent-runner-configuration-guide/spec.md`

## Summary

Extend the local `tools/agent-workflow` CLI with usability helpers for real local Codex/Claude CLI usage: a non-spawning dry-run preview, clearer diagnostics for runner configuration and availability, committed safe example state/config files, and README/quickstart instructions. Execution remains delegated to the existing Spec 043/044 runner paths, preserving failed-run, path-containment, remote-mutation, and human-only gates.

## Technical Context

**Language/Version**: Plain Node.js CommonJS for tooling, TypeScript/Vitest for tests

**Primary Dependencies**: Existing `agentWorkflow.js`, `agentRunner.js`, `agentWorkflowRun.js`, Node built-ins only

**Storage**: Existing gitignored `.agent-workflow/runs/<feature-id>/`; committed examples under `tools/agent-workflow/examples/`

**Testing**: Vitest with injected fake process adapters only

**Target Platform**: Local developer machine

**Project Type**: Developer tooling inside the existing repository

**Performance Goals**: Dry-run performs no subprocess spawn; diagnostics performs at most one version check per safe configured runner

**Constraints**: No product `src/` changes, no external AI SDK/API integration, no credentials, no remote-mutating commands, no human-merge-decision auto-run

**Scale/Scope**: One small CLI/tooling slice plus examples and documentation

## Constitution Check

- **Spec First**: PASS. `spec.md` defines developer stories, requirements, safety boundaries, and success criteria.
- **Plan Before Code**: PASS. This plan defines the seam before implementation.
- **Tasks Gate Implementation**: PASS. `tasks.md` will be created before code changes.
- **Preserve Application Stability**: PASS. No product `src/` files are planned.
- **Validation Is Required**: PASS. Full validation suite is required before commit.

## Existing System Review

- Spec 043 provides provider-neutral runner config, CLI availability detection, safe command checks, path containment, and subprocess execution through injectable process adapters.
- Spec 044 provides the `run` orchestration command and stop conditions.
- Smallest UX seam:
  - add a dry-run helper above `runWorkflowAgent` that resolves stage/agent, generates a prompt path, and reports what would run without calling the process adapter;
  - add diagnostics helpers that reuse runner config normalization and safety checks before optional version detection;
  - improve summary/error formatting in the CLI without changing execution semantics.

## Project Structure

```text
specs/045-agent-runner-configuration-guide/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── runner-configuration-guide.md
├── checklists/
│   └── requirements.md
└── tasks.md

tools/agent-workflow/
├── agentRunner.js
├── agentRunner.test.ts
├── agentWorkflowRun.js
├── agentWorkflowRun.test.ts
├── cli.js
├── README.md
└── examples/
    ├── codex-claude-state.json
    └── local-runner-config.json
```

## Dry-Run Design

- `run --dry-run --state <path>` previews exactly the current stage by default.
- `--stage` and `--agent` can preview overrides without spawning.
- Dry-run output includes current stage, selected agent, command plus args, prompt path, run directory, next expected step, and blocked reason when applicable.
- Prompt output is written using existing run-path helpers so the user can inspect the exact prompt that would be sent.

## Diagnostics Design

- `diagnose --state <path>` reports all runner ids referenced by defaults, `state.agentRunners`, and `state.stageAgents`.
- `detect-agent --agent <id> --state <path>` may inspect state-specific runner config; existing default detection remains available.
- Diagnostics checks command presence, command safety, and availability. Unsafe commands are reported and are never spawned.
- All tests use injected fake process adapters.

## Safety Boundary

- Dry-run never calls `runWorkflowAgent` and never invokes the process adapter.
- Diagnostics only invokes safe runner commands with `--version` and still uses fake adapters in tests.
- Existing execution continues to call Spec 043 `runWorkflowAgent`, so failed runs still do not record stage results.
- No push, PR creation, PR ready, PR merge, branch deletion, or human merge decision execution is added.
- No credentials, tokens, API keys, external SDK/API calls, or product runtime changes.

## Validation

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```

## Post-Design Constitution Check

The design remains local-only, human-gated, dependency-free, and scoped to developer tooling plus Spec Kit artifacts.
