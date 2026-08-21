# Implementation Plan: Home Route Playwright Canvas Boot Smoke

**Branch**: `codex/117-home-route-playwright-canvas-boot-smoke` | **Date**: 2026-08-20 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/117-home-route-playwright-canvas-boot-smoke/spec.md`

## Summary

Add deterministic smoke coverage for the home route's city canvas entry path. The implementation verifies that `src/app/page.tsx` returns the city view route content and that the city view includes the canvas entry component exercised by the existing canvas boot smoke.

## Technical Context

**Language/Version**: TypeScript with the existing Next.js application

**Primary Dependencies**: Existing React and Vitest setup

**Storage**: N/A

**Testing**: Focused Vitest smoke coverage; full validation and Playwright execution are prohibited in this ADOS runtime

**Target Platform**: Desktop web browser home route

**Project Type**: Web application

**Performance Goals**: Focused smoke coverage should remain lightweight and deterministic

**Constraints**: Do not add browser automation dependencies; do not run validation, start review, publish, merge, deploy, mutate GitHub, or modify the primary repository from this runtime

**Scale/Scope**: One focused route composition smoke test and Spec Kit traceability artifacts

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Spec First**: PASS. `spec.md` defines the user-facing home route canvas smoke goal and safety expectations.
- **Plan Before Code**: PASS. This plan identifies the targeted route/test surface before implementation.
- **Tasks Gate Implementation**: PASS once `tasks.md` exists for this feature.
- **Preserve Application Stability**: PASS. Scope is limited to smoke coverage without route behavior changes.
- **Validation Is Required**: PASS. Validation commands are documented, but this ADOS runtime must not execute them.

## Project Structure

### Documentation (this feature)

```text
specs/117-home-route-playwright-canvas-boot-smoke/
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
src/app/
|-- page.tsx
`-- page.canvas-boot-smoke.test.ts
```

**Structure Decision**: Keep the smoke validation next to the home route and avoid new browser automation or rendering dependencies.

## Phase 0: Research

See [research.md](./research.md).

## Phase 1: Design & Contracts

See [data-model.md](./data-model.md), [contracts/home-route-playwright-canvas-boot-smoke.md](./contracts/home-route-playwright-canvas-boot-smoke.md), and [quickstart.md](./quickstart.md).

## Constitution Check

*Post-design re-check.*

- **Spec First**: PASS. The feature remains documented as a user-facing smoke validation need.
- **Plan Before Code**: PASS. Design artifacts are present.
- **Tasks Gate Implementation**: PASS after task generation.
- **Preserve Application Stability**: PASS. Planned changes are limited to focused route smoke coverage.
- **Validation Is Required**: PASS. Focused and full validation commands are listed only for an allowed validation runtime.
