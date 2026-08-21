# Implementation Plan: Daily Proof Portal Browser Smoke Validation

**Branch**: `codex/115-daily-proof-portal-browser-smoke-validation` | **Date**: 2026-08-20 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/115-daily-proof-portal-browser-smoke-validation/spec.md`

## Summary

Add deterministic smoke coverage for the Daily Proof Project Portal browser-facing controller path. The implementation uses existing scene/controller fixtures to open the portal, select Daily Proof, reach the project dashboard, and drive the runtime-start chain while asserting no implementer, reviewer, validation, publication, merge, deployment, or GitHub mutation flow starts.

## Technical Context

**Language/Version**: TypeScript with the existing Next.js application

**Primary Dependencies**: Existing React, Phaser, and Vitest setup

**Storage**: Existing in-memory Project Portal state only

**Testing**: Focused Vitest smoke coverage; full validation is prohibited in this runtime by the ADOS handoff

**Target Platform**: Desktop web browser office dashboard

**Project Type**: Web application

**Performance Goals**: Focused smoke coverage should remain lightweight and deterministic

**Constraints**: Do not add browser automation dependencies; do not run validation, start review, publish, merge, deploy, mutate GitHub, or modify the primary repository from this runtime

**Scale/Scope**: One focused test file plus Spec Kit traceability artifacts

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Spec First**: PASS. `spec.md` defines the user-facing Daily Proof smoke validation goal and safety expectations.
- **Plan Before Code**: PASS. This plan identifies the targeted controller/test surface before implementation.
- **Tasks Gate Implementation**: PASS once `tasks.md` exists for this feature.
- **Preserve Application Stability**: PASS. Scope is limited to focused test coverage and feature artifacts.
- **Validation Is Required**: PASS. Validation commands are documented, but this ADOS runtime must not execute them.

## Project Structure

### Documentation (this feature)

```text
specs/115-daily-proof-portal-browser-smoke-validation/
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
src/features/city-view/scene/office/
|-- OfficeProjectPortalController.browser-smoke.test.ts
`-- OfficeProjectPortalController.testHelpers.ts
```

**Structure Decision**: Keep the smoke validation in the existing office portal test area and reuse the established Daily Proof controller helper rather than adding new runtime dependencies or browser automation infrastructure.

## Phase 0: Research

See [research.md](./research.md).

## Phase 1: Design & Contracts

See [data-model.md](./data-model.md), [contracts/daily-proof-portal-browser-smoke-validation.md](./contracts/daily-proof-portal-browser-smoke-validation.md), and [quickstart.md](./quickstart.md).

## Constitution Check

*Post-design re-check.*

- **Spec First**: PASS. The feature remains documented as a user-facing smoke validation need.
- **Plan Before Code**: PASS. Design artifacts are present.
- **Tasks Gate Implementation**: PASS after task generation.
- **Preserve Application Stability**: PASS. Planned changes are limited to a focused test and Spec Kit artifacts.
- **Validation Is Required**: PASS. Focused and full validation commands are listed only for an allowed validation runtime.
