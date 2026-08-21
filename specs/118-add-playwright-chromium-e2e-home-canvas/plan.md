# Implementation Plan: Add Playwright Chromium E2E Home Canvas Smoke Script

**Branch**: `codex/118-add-playwright-chromium-e2e-home-canvas` | **Date**: 2026-08-20 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/118-add-playwright-chromium-e2e-home-canvas/spec.md`

## Summary

Add a focused Playwright Chromium smoke script for the home route's city canvas. The implementation introduces the minimal Playwright test dependency and configuration, adds one E2E test that navigates to `/`, waits for the city canvas host and rendered canvas, and fails on page errors, console warnings, or console errors.

## Technical Context

**Language/Version**: TypeScript with the existing Next.js application

**Primary Dependencies**: Existing React/Next.js stack plus Playwright test runner for Chromium E2E coverage

**Storage**: N/A

**Testing**: Playwright focused Chromium E2E smoke script; full validation commands are prohibited in this ADOS runtime

**Target Platform**: Desktop Chromium browser against the local web app

**Project Type**: Web application

**Performance Goals**: Focused E2E smoke should complete in under 60 seconds after dependencies and browser binaries are available

**Constraints**: Mutate only this feature worktree; do not run validation, start review, publish, merge, deploy, mutate GitHub, or modify the primary repository from this runtime

**Scale/Scope**: One Playwright config, one focused E2E test, and one npm script

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Spec First**: PASS. `spec.md` defines the user-facing home canvas browser smoke goal and acceptance criteria.
- **Plan Before Code**: PASS. This plan identifies the targeted Playwright script and E2E surface before implementation.
- **Tasks Gate Implementation**: PASS once `tasks.md` exists for this feature.
- **Preserve Application Stability**: PASS. Scope is limited to browser smoke tooling and does not alter home route behavior.
- **Validation Is Required**: PASS. Validation commands and the focused smoke command are documented, but this ADOS runtime must not execute them.

## Project Structure

### Documentation (this feature)

```text
specs/118-add-playwright-chromium-e2e-home-canvas/
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
e2e/
`-- home-canvas-smoke.spec.ts

playwright.config.ts
package.json
package-lock.json
```

**Structure Decision**: Keep Playwright E2E smoke coverage in a top-level `e2e/` directory with a root Playwright config and package script, matching common Next.js project conventions while avoiding app behavior changes.

## Phase 0: Research

See [research.md](./research.md).

## Phase 1: Design & Contracts

See [data-model.md](./data-model.md), [contracts/home-canvas-e2e-smoke.md](./contracts/home-canvas-e2e-smoke.md), and [quickstart.md](./quickstart.md).

## Constitution Check

*Post-design re-check.*

- **Spec First**: PASS. The feature remains documented as a user-facing browser smoke validation need.
- **Plan Before Code**: PASS. Design artifacts are present.
- **Tasks Gate Implementation**: PASS after task generation.
- **Preserve Application Stability**: PASS. Planned changes are limited to focused E2E tooling and smoke coverage.
- **Validation Is Required**: PASS. Focused and full validation commands are listed only for an allowed validation runtime.
