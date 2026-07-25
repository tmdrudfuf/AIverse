# Implementation Plan: Runtime Role Selection

**Branch**: `codex/runtime-role-selection` | **Date**: 2026-07-25 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/053-runtime-role-selection/spec.md`

## Summary

Add a small, pure, independently testable role resolver (`tools/agent-workflow/roleResolver.js`) that centralizes Implementer/Reviewer resolution for `orchestrate` (and, where it fits cleanly, `run`, `run-review`, `detect-agent`). A CLI `--implementer <agent-id>` flag lets a maintainer pick the Implementer for one execution; the workflow automatically resolves the other configured agent (from a small role roster, default `["codex", "claude"]`) as Reviewer. Resolution priority is CLI override, then state-configured `stageAgents`, then existing defaults. Once an `orchestrate` run has resolved roles, those roles are pinned into `state.orchestration` and reused for the remaining lifetime of that run; a resumed execution with a conflicting `--implementer` is rejected before any spawn. All existing runner-safety checks (Spec 045) run against the actually-resolved runner configuration before any process spawn, and existing behavior when `--implementer` is not supplied is unchanged.

## Technical Context

**Language/Version**: JavaScript/CommonJS with TypeScript tests

**Primary Dependencies**: Existing Node.js standard library, Vitest test suite, Git CLI context collection

**Storage**: JSON state files and run artifacts under `.agent-workflow/`

**Testing**: Vitest focused workflow tests plus full `npm test`

**Target Platform**: Local Windows PowerShell-compatible CLI workflow; cross-platform Node process execution paths preserved

**Project Type**: Local CLI/developer workflow tooling

**Performance Goals**: Role resolution is pure in-memory computation over already-loaded state and runner config; negligible compared with agent execution and validation commands

**Constraints**: No remote mutation, no live AI in automated tests, old state files remain readable, runner safety checks apply to the actual resolved runner (not just the name), no CLI-level role change may weaken Spec 045 safety guarantees

**Scale/Scope**: One CLI flag, one new resolver module, additive state fields, targeted call-site changes in `orchestrateCommand.js`, `reviewCommand.js`, `cli.js`, `agentWorkflowRun.js`

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Spec Kit workflow followed: spec, plan, design artifacts, tasks before implementation.
- Existing architecture is extended at the current role-resolution seam (`resolveRoleRunner`/`resolveAgentConfig`), not replaced.
- Runtime artifacts stay under `.agent-workflow/` and are not committed.
- Remote mutations remain human-only; runner safety checks are preserved and applied to the actually-resolved runner.

## Project Structure

### Documentation (this feature)

```text
specs/053-runtime-role-selection/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── role-resolution.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
tools/agent-workflow/
├── roleResolver.js
├── roleResolver.test.ts
├── agentRunner.js
├── agentRunner.test.ts
├── orchestrateCommand.js
├── orchestrateCommand.test.ts
├── reviewCommand.js
├── reviewCommand.test.ts
├── agentWorkflowRun.js
├── agentWorkflowRun.test.ts
├── cli.js
├── cli.test.ts
└── README.md
```

**Structure Decision**: Role resolution logic belongs in one focused, pure module (`roleResolver.js`) with no filesystem or process access, so it can be unit tested directly and reused by every command that resolves roles. `orchestrateCommand.js` owns run-scoped role pinning (persisting `resolvedImplementerId`/`resolvedReviewerId`/`roleResolutionSource` once per run) and threading the resolved ids through every stage. `reviewCommand.js` and `agentWorkflowRun.js`/`cli.js` call the same resolver for their own narrower, non-run-scoped use of `--implementer`.

## Complexity Tracking

No constitution violations. The only new abstraction is the role resolver module, which replaces what would otherwise be duplicated ad hoc "pick the other agent" logic across three call sites.
