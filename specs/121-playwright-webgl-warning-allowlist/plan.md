# Implementation Plan: Playwright WebGL Warning Allowlist

**Branch**: `codex/121-playwright-webgl-warning-allowlist` | **Date**: 2026-08-21 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/121-playwright-webgl-warning-allowlist/spec.md`

## Summary

Keep the focused home canvas Playwright smoke strict for actionable browser failures while allowing a narrow, documented warning-level WebGL signal that can be produced by Chromium graphics startup. The implementation will extract browser signal filtering into an inspectable helper, cover the helper with focused tests, and wire the smoke test through that helper.

## Technical Context

**Language/Version**: TypeScript 5.8.3, Node.js 20 types

**Primary Dependencies**: Next.js 16.2.9, React 19.2.7, Phaser 3.90.0, Playwright 1.62.1, Vitest 4.1.9

**Storage**: N/A

**Testing**: Vitest for helper behavior; Playwright Chromium smoke command for end-to-end validation in an allowed validation runtime

**Target Platform**: Local and CI browser validation for a Next.js web application

**Project Type**: Web application with browser E2E smoke coverage

**Performance Goals**: No measurable runtime overhead beyond checking a small static warning allowlist

**Constraints**: Do not weaken page error or console error handling. Do not run validation, review, publish, merge, deploy, or mutate GitHub from this ADOS runtime.

**Scale/Scope**: One focused Playwright smoke check and its browser signal filtering behavior

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Spec First: PASS. `spec.md` defines user value, acceptance scenarios, edge cases, and measurable success criteria.
- Plan Before Code: PASS. This plan identifies the technical approach, affected files, validation strategy, risks, and fit with the existing Next.js, Phaser, React, TypeScript, Playwright, and Vitest architecture.
- Tasks Gate Implementation: PASS. Implementation will begin only after `tasks.md` exists and is aligned with this plan.
- Preserve Application Stability: PASS. Scope is limited to the home canvas smoke signal filter and Spec Kit artifacts.
- Validation Is Required: PASS. Validation commands are defined for the handoff, but this ADOS runtime is explicitly prohibited from running them.

## Project Structure

### Documentation (this feature)

```text
specs/121-playwright-webgl-warning-allowlist/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- home-canvas-webgl-warning-allowlist.md
`-- tasks.md
```

### Source Code (repository root)

```text
src/
`-- test-support/
    |-- browserSignalFilter.ts
    `-- browserSignalFilter.test.ts

e2e/
`-- home-canvas-smoke.spec.ts
```

**Structure Decision**: Add a small reusable test-support helper under `src/test-support/` so Vitest can cover the allowlist behavior while the Playwright spec remains focused on browser navigation and assertions.

## Complexity Tracking

No constitution violations.

## Phase 0: Research

See [research.md](./research.md).

## Phase 1: Design & Contracts

See [data-model.md](./data-model.md), [contracts/home-canvas-webgl-warning-allowlist.md](./contracts/home-canvas-webgl-warning-allowlist.md), and [quickstart.md](./quickstart.md).

## Post-Design Constitution Check

- Spec First: PASS. Feature scope remains traceable to `spec.md`.
- Plan Before Code: PASS. Design artifacts identify the helper, test surface, and validation path.
- Tasks Gate Implementation: PASS. `tasks.md` will gate code edits.
- Preserve Application Stability: PASS. No runtime application behavior changes are planned.
- Validation Is Required: PASS. Validation is documented for the proper validation runtime and intentionally not run here.
