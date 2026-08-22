# Implementation Plan: Persistent ADOS Playwright Home Canvas Validation Command

**Branch**: `codex/120-persistent-ados-playwright-home-canvas-validation` | **Date**: 2026-08-21 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/120-persistent-ados-playwright-home-canvas-validation/spec.md`

## Summary

Persist the home canvas Playwright smoke command through ADOS default workflow fixtures and Spec Kit context. Spec 119 already wired the command into the canonical default validation gate; this feature removes stale copied validation lists from workflow tests and points active feature metadata at Spec 120 without executing validation from this runtime.

## Technical Context

**Language/Version**: TypeScript/JavaScript with existing Node.js workflow tooling

**Primary Dependencies**: Existing `tools/agent-workflow` helpers and canonical `DEFAULT_VALIDATION_COMMANDS`

**Storage**: Local JSON state and repository documentation only

**Testing**: Focused workflow fixture coverage is updated, but validation is prohibited in this ADOS runtime

**Target Platform**: Local developer workflow on the AIverse repository

**Project Type**: Web application with local workflow tooling

**Performance Goals**: No runtime overhead; fixture construction remains immediate

**Constraints**: Mutate only this feature worktree; do not run validation, start review, publish, merge, deploy, mutate GitHub, or modify the primary repository from this runtime

**Scale/Scope**: Spec Kit artifacts, active context pointer, and local workflow test fixtures

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Spec First**: PASS. `spec.md` defines the persistence requirement and acceptance criteria.
- **Plan Before Code**: PASS. This plan identifies the targeted fixture and context updates before implementation.
- **Tasks Gate Implementation**: PASS once `tasks.md` exists for this feature.
- **Preserve Application Stability**: PASS. Scope is limited to workflow tooling tests and Spec Kit metadata; no app behavior changes.
- **Validation Is Required**: PASS. Validation commands are documented for an allowed validation runtime, but this ADOS runtime must not execute them.

## Project Structure

### Documentation (this feature)

```text
specs/120-persistent-ados-playwright-home-canvas-validation/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
`-- tasks.md
```

### Source Code (repository root)

```text
tools/agent-workflow/
|-- agentWorkflow.test.ts
|-- agentRunner.test.ts
`-- agentWorkflowRun.test.ts

AGENTS.md
.specify/feature.json
```

**Structure Decision**: Keep production command resolution unchanged and update local workflow fixtures to consume the canonical defaults already exported by `agentWorkflow.js`.

## Phase 0: Research

See [research.md](./research.md).

## Phase 1: Design & Contracts

See [data-model.md](./data-model.md), [contracts/ados-persistent-validation-command.md](./contracts/ados-persistent-validation-command.md), and [quickstart.md](./quickstart.md).

## Constitution Check

*Post-design re-check.*

- **Spec First**: PASS. The feature remains documented as a workflow persistence requirement.
- **Plan Before Code**: PASS. Design artifacts are present.
- **Tasks Gate Implementation**: PASS after task generation.
- **Preserve Application Stability**: PASS. Planned changes are limited to workflow tests, documentation, and Spec Kit metadata.
- **Validation Is Required**: PASS. Focused and full validation commands are listed only for an allowed validation runtime.
