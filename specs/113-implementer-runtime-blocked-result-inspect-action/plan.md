# Implementation Plan: Implementer Runtime Blocked Result Inspect Action

**Branch**: `codex/113-implementer-runtime-blocked-result-inspect-action` | **Date**: 2026-08-20 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/113-implementer-runtime-blocked-result-inspect-action/spec.md`

## Summary

Update the Implementer Runtime blocked-result dashboard row so blocked results explicitly tell the player to inspect the result while preserving the existing Codex-not-started safety wording. Keep ready, completed, timed-out, cancelled, and failed outcome rows behaviorally unchanged.

## Technical Context

**Language/Version**: TypeScript with the existing Next.js application

**Primary Dependencies**: Existing React, Phaser, and Vitest setup

**Storage**: N/A

**Testing**: Focused Vitest coverage for Implementer Runtime display rows; full validation is prohibited in this runtime by the ADOS handoff

**Target Platform**: Desktop web browser dashboard

**Project Type**: Web application

**Performance Goals**: No measurable runtime cost; this is a static row text change

**Constraints**: Keep dashboard row text within the existing wrap budget; do not start reviewer, validation, repository mutation, GitHub mutation, publish, merge, deploy, or validation work from this runtime

**Scale/Scope**: One display helper, its focused test coverage, and Spec Kit traceability artifacts

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Spec First**: PASS. `spec.md` defines the user-facing blocked-result inspect cue.
- **Plan Before Code**: PASS. This plan identifies the targeted display surface and constraints before implementation.
- **Tasks Gate Implementation**: PASS once `tasks.md` exists for this feature.
- **Preserve Application Stability**: PASS. Scope is limited to the Implementer Runtime display helper, focused tests, and feature artifacts.
- **Validation Is Required**: PASS. Validation commands are documented, but this ADOS runtime must not execute them.

## Project Structure

### Documentation (this feature)

```text
specs/113-implementer-runtime-blocked-result-inspect-action/
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
src/features/city-view/scene/office/implementer-runtime/
|-- ImplementerRuntimeView.ts
`-- ImplementerRuntimeView.test.ts
```

**Structure Decision**: Keep the change inside the existing Implementer Runtime display module. No new feature area, dependency, runtime state, or input handler is needed.

## Phase 0: Research

See [research.md](./research.md).

## Phase 1: Design & Contracts

See [data-model.md](./data-model.md), [contracts/implementer-runtime-blocked-result.md](./contracts/implementer-runtime-blocked-result.md), and [quickstart.md](./quickstart.md).

## Constitution Check

*Post-design re-check.*

- **Spec First**: PASS. The feature remains documented as a user-facing blocked-result cue.
- **Plan Before Code**: PASS. Design artifacts are present.
- **Tasks Gate Implementation**: PASS after task generation.
- **Preserve Application Stability**: PASS. The planned code surface is tightly scoped.
- **Validation Is Required**: PASS. Focused and full validation commands are listed only for an allowed validation runtime.
