# Implementation Plan: CLI Agent Runner Foundation

**Branch**: `043-cli-agent-runner-foundation` | **Date**: 2026-07-08 | **Spec**: `specs/043-cli-agent-runner-foundation/spec.md`

**Input**: Feature specification from `specs/043-cli-agent-runner-foundation/spec.md`

## Summary

Extend Spec 042's local `tools/agent-workflow` helper with a provider-neutral CLI runner layer. The runner detects configured agent CLIs, generates the workflow prompt for the selected stage, executes the configured command with `shell: false`, captures process output/metadata, writes JSON execution records under `.agent-workflow/runs/<feature-id>/`, and appends a workflow result. Human merge decisions and remote-mutating command configs are refused before any subprocess is spawned.

## Technical Context

**Language/Version**: Plain Node.js CommonJS for local tooling, TypeScript/Vitest for tests

**Primary Dependencies**: Node built-ins only (`child_process`, `fs`, `path`)

**Storage**: Gitignored `.agent-workflow/runs/<feature-id>/` only

**Testing**: Vitest with injected fake process adapters

**Target Platform**: Local developer machine

**Project Type**: Developer tooling inside existing Next.js repository

**Performance Goals**: Runner starts one configured process per explicit command; no background loop

**Constraints**: No product `src/` code, no external SDK/API integration, no credential storage, no remote-mutating commands executed by tooling

**Scale/Scope**: One new runner module, CLI subcommands, tests, README/spec updates

## Constitution Check

- **Spec First**: PASS. `spec.md` defines stories, requirements, and safety boundaries.
- **Plan Before Code**: PASS. This plan documents the runner seam and process safety before implementation.
- **Tasks Gate Implementation**: PASS. `tasks.md` will be created before code.
- **Preserve Application Stability**: PASS. No product `src/` files will be touched.
- **Validation Is Required**: PASS. Full validation suite required before commit.

## Existing System Review

- Spec 042 already provides deterministic stage selection, prompt generation, result recording, safe feature-id sanitization, and run-directory containment.
- The smallest correct seam is a new `agentRunner.js` module that reuses `generatePrompt`, `recordAgentResult`, `writeState`, `getRunDirectory`, `sanitizeFeatureId`, and the existing stage constants.
- `cli.js` is the existing manual command entrypoint and can receive new `detect-agent` and `run-agent` commands without changing product runtime code.
- Local CLI inspection on this machine found `codex` installed (`codex-cli 0.142.3`) and `claude`/`claude-code` not installed. The implementation must still support both through configurable runner definitions and tests must not call either real service.

## Project Structure

```text
specs/043-cli-agent-runner-foundation/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── cli-agent-runner.md
├── checklists/
│   └── requirements.md
└── tasks.md

tools/agent-workflow/
├── agentWorkflow.js
├── agentWorkflow.test.ts
├── agentRunner.js
├── agentRunner.test.ts
├── cli.js
└── README.md
```

## Runner Architecture

1. **Runner Config**: Provider-neutral runner config with `agentId`, `identity`, `command`, `args`, and `inputMode`.
2. **Detection**: `detectAgentCli(config, adapter)` runs the configured command with `--version` through the injected/default process adapter and returns installed/unavailable metadata.
3. **Execution**: `runWorkflowAgent(state, options)` selects stage and agent, refuses human merge decision, validates command safety, generates a prompt, executes through adapter, writes a JSON execution record under `.agent-workflow/runs/<feature-id>/`, and appends a workflow result.
4. **Process Adapter**: Default adapter uses `child_process.spawn` with `shell: false`, stdin prompt delivery, timeout kill, stdout/stderr capture, and signal capture. Tests use fake adapters only.

## Safety Boundary

- No automatic background operation.
- No shell execution.
- No `git push`, `gh pr create`, `gh pr ready`, `gh pr merge`, branch deletion, or remote-mutating command configs.
- No auto-run for `human-merge-decision`.
- No external AI SDK/API calls; only explicitly configured local CLI subprocesses.
- No secrets or credentials stored in repository files or run records beyond process output captured from local CLIs.

## Validation

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```

## Post-Design Constitution Check

The design remains local-only, developer-only, human-gated, dependency-free, and isolated to `tools/agent-workflow` plus Spec Kit artifacts.
