# Implementation Plan: Daily Proof Canvas Boot Console Smoke

**Branch**: `codex/116-daily-proof-canvas-boot-console-smoke` | **Date**: 2026-08-20 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/116-daily-proof-canvas-boot-console-smoke/spec.md`

## Summary

Add deterministic smoke coverage for the Daily Proof city canvas boot path. The implementation exposes the existing Phaser game boot boundary as a small helper used by the browser component, then verifies with a mocked Phaser runtime that boot requests the expected scene configuration and emits no console warnings or errors.

## Technical Context

**Language/Version**: TypeScript with the existing Next.js application

**Primary Dependencies**: Existing React, Phaser, and Vitest setup

**Storage**: N/A

**Testing**: Focused Vitest smoke coverage; full validation is prohibited in this runtime by the ADOS handoff

**Target Platform**: Desktop web browser city canvas

**Project Type**: Web application

**Performance Goals**: Focused smoke coverage should remain lightweight and deterministic

**Constraints**: Do not add browser automation dependencies; do not run validation, start review, publish, merge, deploy, mutate GitHub, or modify the primary repository from this runtime

**Scale/Scope**: One focused test file, one small canvas boot helper extraction, and Spec Kit traceability artifacts

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Spec First**: PASS. `spec.md` defines the user-facing Daily Proof canvas boot smoke goal and safety expectations.
- **Plan Before Code**: PASS. This plan identifies the targeted canvas boot/test surface before implementation.
- **Tasks Gate Implementation**: PASS once `tasks.md` exists for this feature.
- **Preserve Application Stability**: PASS. Scope is limited to a helper extraction that preserves component behavior plus focused test coverage.
- **Validation Is Required**: PASS. Validation commands are documented, but this ADOS runtime must not execute them.

## Project Structure

### Documentation (this feature)

```text
specs/116-daily-proof-canvas-boot-console-smoke/
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
src/features/city-view/
|-- CitySceneCanvas.tsx
`-- CitySceneCanvas.boot-smoke.test.ts
```

**Structure Decision**: Keep the smoke validation next to the city canvas component and avoid new browser automation or rendering dependencies.

## Phase 0: Research

See [research.md](./research.md).

## Phase 1: Design & Contracts

See [data-model.md](./data-model.md), [contracts/daily-proof-canvas-boot-console-smoke.md](./contracts/daily-proof-canvas-boot-console-smoke.md), and [quickstart.md](./quickstart.md).

## Constitution Check

*Post-design re-check.*

- **Spec First**: PASS. The feature remains documented as a user-facing smoke validation need.
- **Plan Before Code**: PASS. Design artifacts are present.
- **Tasks Gate Implementation**: PASS after task generation.
- **Preserve Application Stability**: PASS. Planned changes are limited to a behavior-preserving helper extraction and a focused smoke test.
- **Validation Is Required**: PASS. Focused and full validation commands are listed only for an allowed validation runtime.
