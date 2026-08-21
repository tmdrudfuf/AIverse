# Implementation Plan: Playwright Home Canvas Smoke ADOS Validation Gate

**Branch**: `codex/119-playwright-home-canvas-smoke-ados-validation` | **Date**: 2026-08-21 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/119-playwright-home-canvas-smoke-ados-validation/spec.md`

## Summary

Wire the existing Spec 118 home canvas Playwright smoke command into the local ADOS workflow's default full validation gate. The implementation updates the default validation command list, prompt coverage tests, workflow documentation, and Spec Kit traceability without executing validation from this runtime.

## Technical Context

**Language/Version**: TypeScript/JavaScript with the existing Next.js and Node.js workflow tooling

**Primary Dependencies**: Existing `tools/agent-workflow` helpers and the existing Playwright smoke command from Spec 118

**Storage**: N/A

**Testing**: Focused Vitest coverage for validation command resolution and prompt rendering; full validation is prohibited in this ADOS runtime

**Target Platform**: Local developer workflow on the AIverse repository

**Project Type**: Web application with local workflow tooling

**Performance Goals**: No additional overhead outside validation runtimes; command resolution remains pure and immediate

**Constraints**: Mutate only this feature worktree; do not run validation, start review, publish, merge, deploy, mutate GitHub, or modify the primary repository from this runtime

**Scale/Scope**: One default command list, focused tests, workflow documentation, and Spec Kit artifacts

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Spec First**: PASS. `spec.md` defines the user-facing validation gate need and acceptance criteria.
- **Plan Before Code**: PASS. This plan identifies the targeted workflow command list and documentation before implementation.
- **Tasks Gate Implementation**: PASS once `tasks.md` exists for this feature.
- **Preserve Application Stability**: PASS. Scope is limited to workflow validation tooling and docs; no app behavior changes.
- **Validation Is Required**: PASS. Focused and full validation commands are documented, but this ADOS runtime must not execute them.

## Project Structure

### Documentation (this feature)

```text
specs/119-playwright-home-canvas-smoke-ados-validation/
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
|-- agentWorkflow.js
|-- agentWorkflow.test.ts
|-- validationPolicy.test.ts
`-- README.md

AGENTS.md
.specify/feature.json
```

**Structure Decision**: Keep the gate in `tools/agent-workflow/agentWorkflow.js`, where the default validation commands already live, and cover behavior in existing workflow tests.

## Phase 0: Research

See [research.md](./research.md).

## Phase 1: Design & Contracts

See [data-model.md](./data-model.md), [contracts/ados-home-canvas-validation-gate.md](./contracts/ados-home-canvas-validation-gate.md), and [quickstart.md](./quickstart.md).

## Constitution Check

*Post-design re-check.*

- **Spec First**: PASS. The feature remains documented as a validation-gate requirement.
- **Plan Before Code**: PASS. Design artifacts are present.
- **Tasks Gate Implementation**: PASS after task generation.
- **Preserve Application Stability**: PASS. Planned changes are limited to workflow tooling and documentation.
- **Validation Is Required**: PASS. Focused and full validation commands are listed only for an allowed validation runtime.
