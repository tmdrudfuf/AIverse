# Implementation Plan: City Canvas Read-Only E2E State Probe

**Branch**: `codex/122-city-canvas-read-only-e2e-state` | **Date**: 2026-08-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/122-city-canvas-read-only-e2e-state/spec.md`

## Summary

Expose a narrow read-only boot-state probe on the existing city canvas host and extend the focused home canvas Playwright smoke to assert the expected ready state, logical dimensions, configured scene count, and rendered canvas count. The implementation keeps the probe DOM-local and passive so it cannot start workflows, mutate application state, or weaken browser signal failures.

## Technical Context

**Language/Version**: TypeScript 5.8.3, Node.js 20 types

**Primary Dependencies**: Next.js 16.2.9, React 19.2.7, Phaser 3.90.0, Playwright 1.62.1, Vitest 4.1.9

**Storage**: N/A

**Testing**: Vitest focused canvas boot coverage; Playwright Chromium home canvas smoke in an allowed validation runtime

**Target Platform**: Local and CI browser validation for a Next.js web application

**Project Type**: Web application with Phaser canvas and browser E2E smoke coverage

**Performance Goals**: Probe updates are limited to a few host attributes during boot and unmount.

**Constraints**: Read-only observation only. Do not add controls, storage, network calls, repository mutation, GitHub mutation, validation execution, review execution, publication, merge, deployment, or AI runtime starts from this ADOS runtime.

**Scale/Scope**: One focused home route city canvas probe and one Playwright smoke assertion path.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Spec First: PASS. `spec.md` defines user value, acceptance scenarios, edge cases, assumptions, and measurable success criteria.
- Plan Before Code: PASS. This plan identifies the technical approach, affected files, validation strategy, risks, and architectural fit.
- Tasks Gate Implementation: PASS. Implementation begins only after `tasks.md` exists and is aligned with this plan.
- Preserve Application Stability: PASS. Scope is limited to passive state attributes and the focused home canvas smoke.
- Validation Is Required: PASS. Validation commands are documented, but this ADOS runtime is explicitly prohibited from running them.

## Project Structure

### Documentation (this feature)

```text
specs/122-city-canvas-read-only-e2e-state/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- city-canvas-e2e-state-probe.md
`-- tasks.md
```

### Source Code (repository root)

```text
src/
`-- features/
    `-- city-view/
        |-- CitySceneCanvas.tsx
        `-- CitySceneCanvas.boot-smoke.test.ts

e2e/
`-- home-canvas-smoke.spec.ts
```

**Structure Decision**: Keep the probe in `CitySceneCanvas.tsx` because the boot helper already owns Phaser game creation and the host element. Keep E2E assertions in the existing smoke spec so the validation gate remains a single focused command.

## Complexity Tracking

No constitution violations.

## Phase 0: Research

See [research.md](./research.md).

## Phase 1: Design & Contracts

See [data-model.md](./data-model.md), [contracts/city-canvas-e2e-state-probe.md](./contracts/city-canvas-e2e-state-probe.md), and [quickstart.md](./quickstart.md).

## Post-Design Constitution Check

- Spec First: PASS. Feature scope remains traceable to `spec.md`.
- Plan Before Code: PASS. Design artifacts identify the probe contract, test surface, and validation path.
- Tasks Gate Implementation: PASS. `tasks.md` gates code edits.
- Preserve Application Stability: PASS. The probe is passive and DOM-local.
- Validation Is Required: PASS. Validation is documented for the proper validation runtime and intentionally not run here.
