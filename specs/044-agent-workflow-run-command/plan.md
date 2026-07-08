# Implementation Plan: Agent Workflow Run Command

**Branch**: `044-agent-workflow-run-command` | **Date**: 2026-07-08 | **Spec**: `specs/044-agent-workflow-run-command/spec.md`

**Input**: Feature specification from `specs/044-agent-workflow-run-command/spec.md`

## Summary

Add a `run` command to the local agent workflow CLI. The command loads workflow state, determines the current stage, invokes Spec 043's configured local agent runner for runnable stages, records diagnostics, records stage results only on successful executions, persists state, recomputes the next stage, and stops before human-merge-decision or other blocked states. Default mode runs one stage; `--until-blocked` loops with a max-step guard.

## Technical Context

**Language/Version**: Plain Node.js CommonJS, TypeScript/Vitest tests

**Primary Dependencies**: Existing `agentWorkflow.js`, `agentRunner.js`, Node built-ins

**Storage**: Existing gitignored `.agent-workflow/runs/<feature-id>/`

**Testing**: Vitest with fake process adapters only

**Target Platform**: Local developer machine

**Project Type**: Developer tooling

**Constraints**: No product `src/` changes, no SDK/API integration, no remote-mutating commands, no human-merge-decision auto-run

## Existing System Review

- Spec 042 supplies stage calculation, prompt generation, run path safety, and result recording.
- Spec 043 supplies provider-neutral CLI execution and failure-gated result recording.
- Smallest seam: add `agentWorkflowRun.js` above `runWorkflowAgent`, plus a `run` branch in `cli.js`.

## Project Structure

```text
specs/044-agent-workflow-run-command/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── workflow-run-command.md
├── checklists/
│   └── requirements.md
└── tasks.md

tools/agent-workflow/
├── agentWorkflowRun.js
├── agentWorkflowRun.test.ts
└── cli.js
```

## Command Design

- `run --state <path>`: run exactly one current stage.
- `run --state <path> --until-blocked`: continue until a stop condition.
- `--max-steps <n>`: loop guard, defaults to 6 in multi-stage mode and 1 otherwise.
- `--agent <id>` and `--stage <stage>` remain optional overrides for the first/single run.

## Safety Boundary

- The command delegates actual CLI execution to Spec 043's `runWorkflowAgent`, which already refuses human-merge-decision and remote-mutating command configs.
- The orchestration loop checks human-merge-decision before every step.
- Failed executions stop the loop and do not advance stage because Spec 043 records only diagnostics for failures.
- Missing runner config stops before spawning.

## Validation

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```
