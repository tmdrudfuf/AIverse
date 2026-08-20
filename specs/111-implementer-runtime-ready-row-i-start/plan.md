# Implementation Plan: Implementer Runtime Ready Row I Start Label

**Branch**: `codex/111-implementer-runtime-ready-row-i-start` | **Date**: 2026-08-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/111-implementer-runtime-ready-row-i-start/spec.md`

## Summary

Update the Implementer Runtime ready-state dashboard row so the row explicitly names the `I` start input when Runtime Start is ready and no Implementer Runtime attempt exists. Keep unavailable and completed outcome rows unchanged, and preserve the existing no-review/no-validation/no-mutation wording guarantees.

## Technical Context

**Language/Version**: TypeScript with the existing Next.js application

**Primary Dependencies**: Existing React, Phaser, and Vitest setup

**Storage**: N/A

**Testing**: Focused Vitest coverage for Implementer Runtime display rows; full validation is handled outside this runtime per handoff policy

**Target Platform**: Desktop web browser dashboard

**Project Type**: Web application

**Performance Goals**: No measurable runtime cost; this is a static row text change

**Constraints**: Keep dashboard row text within the existing wrap budget; do not start reviewer, validation, repository mutation, GitHub mutation, publish, merge, deploy, or validation work from this runtime

**Scale/Scope**: One display helper and its focused test coverage

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Spec First**: PASS. `spec.md` defines the user-facing ready row label behavior.
- **Plan Before Code**: PASS. This plan identifies the targeted display surface and constraints before implementation.
- **Tasks Gate Implementation**: PASS once `tasks.md` exists for this feature.
- **Preserve Application Stability**: PASS. Scope is limited to the Implementer Runtime display helper and focused tests.
- **Validation Is Required**: PASS. Validation commands are documented, but this runtime must not execute them per the ADOS handoff.

## Project Structure

### Documentation (this feature)

```text
specs/111-implementer-runtime-ready-row-i-start/
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

**Structure Decision**: Keep the change inside the existing Implementer Runtime display module. No new feature area, dependency, or runtime state is needed.

## Phase 0: Research

See [research.md](./research.md).

## Phase 1: Design & Contracts

See [data-model.md](./data-model.md), [contracts/implementer-runtime-ready-row.md](./contracts/implementer-runtime-ready-row.md), and [quickstart.md](./quickstart.md).

## Constitution Check

*Post-design re-check.*

- **Spec First**: PASS. The feature remains documented as a user-facing label refinement.
- **Plan Before Code**: PASS. Design artifacts are present.
- **Tasks Gate Implementation**: PASS after task generation.
- **Preserve Application Stability**: PASS. The planned code surface is tightly scoped.
- **Validation Is Required**: PASS. Focused and full validation commands are listed for an allowed runtime.
