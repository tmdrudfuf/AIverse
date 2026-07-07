# Implementation Plan: Agent Review Orchestration

**Branch**: `042-agent-review-orchestration` | **Date**: 2026-07-08 | **Spec**: `specs/042-agent-review-orchestration/spec.md`

**Input**: Feature specification from `specs/042-agent-review-orchestration/spec.md`

## Summary

Add a developer-only local workflow helper under `tools/agent-workflow/` that generates stage-specific Claude/Codex coordination prompts from a small workflow state file, records pasted/local agent outputs under a gitignored `.agent-workflow/runs/<feature-id>/` directory, and preserves human approval gates. The tool is deterministic, offline, and does not execute remote-mutating commands or call external AI/network services.

## Technical Context

**Language/Version**: Plain Node.js CommonJS for the local script, existing TypeScript/Vitest for tests

**Primary Dependencies**: Node built-ins only (`fs`, `path`)

**Storage**: Gitignored local files under `.agent-workflow/runs/<feature-id>/`; versioned templates under `tools/agent-workflow/templates/`

**Testing**: Vitest

**Target Platform**: Local developer machine

**Project Type**: Developer tool inside the existing Next.js repository

**Performance Goals**: Prompt generation and result recording complete synchronously for small local files

**Constraints**: No network calls, no external AI invocation, no GitHub API, no push/PR/merge/branch deletion execution, no product UI changes, no heavy dependencies

**Scale/Scope**: One small local workflow module, one CLI wrapper, six templates, one README, deterministic tests

## Constitution Check

- **Spec First**: PASS. `spec.md` exists before implementation.
- **Plan Before Code**: PASS. This plan defines the local-only script boundaries before code changes.
- **Tasks Gate Implementation**: PASS. `tasks.md` will exist before implementation.
- **Preserve Application Stability**: PASS. No product runtime files are changed.
- **Validation Is Required**: PASS. `npm test`, `npx tsc --noEmit`, `npm run build`, `git diff --check`, and `git diff --cached --check` are required before commit.

No constitution violations are expected.

## Project Structure

### Documentation (this feature)

```text
specs/042-agent-review-orchestration/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── workflow-state.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code

```text
tools/agent-workflow/
├── README.md
├── agentWorkflow.js
├── agentWorkflow.test.ts
├── cli.js
└── templates/
    ├── implement.md
    ├── review.md
    ├── fix.md
    ├── re-review.md
    ├── final-verification.md
    └── human-merge-decision.md
```

**Structure Decision**: Keep the workflow outside `src/` because it is developer-only tooling, not product code. Use Node built-ins and CommonJS so the CLI can run with `node tools/agent-workflow/cli.js` without transpilation.

## Phase 0 Research

See `research.md`.

## Phase 1 Design

See `data-model.md`, `contracts/workflow-state.md`, and `quickstart.md`.

## Safety Model

- The workflow writes only to a caller-provided state file and `.agent-workflow/runs/<feature-id>/`.
- The library and CLI do not import `child_process`, `http`, `https`, or fetch-like libraries.
- Remote-mutating commands can appear only as generated text labeled `HUMAN-ONLY`; the tool never executes them.
- Generated prompts repeat the no-push/no-merge rules so each handoff preserves the approval gate.
- The workflow can be run from a separate git worktree; prompts include the primary worktree path if provided, instructing agents not to touch it.

## Validation

Implementation must run:

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```

Manual smoke test:

```powershell
node tools/agent-workflow/cli.js next --state .agent-workflow/example-state.json
node tools/agent-workflow/cli.js record --state .agent-workflow/example-state.json --stage implement --agent Claude --result-file .\local-result.txt
node tools/agent-workflow/cli.js next --state .agent-workflow/example-state.json --write
```

## Post-Design Constitution Check

The design remains local-only, spec-driven, deterministic, and does not alter product behavior or remote repository state.
