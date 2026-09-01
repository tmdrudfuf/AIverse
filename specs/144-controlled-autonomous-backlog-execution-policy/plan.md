# Implementation Plan: Controlled Autonomous Backlog Execution Policy

**Branch**: `codex/144-controlled-autonomous-backlog-execution-policy` | **Date**: 2026-09-01 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/144-controlled-autonomous-backlog-execution-policy/spec.md`

## Summary

Add a project-scoped autonomy policy and deterministic coordinator around the existing Spec 142 Ready-task-to-development bridge. Persist policies with browser office session state, expose compact office controls and read-only portfolio status, and keep default/manual behavior unchanged unless an operator explicitly enables a project's policy.

## Technical Context

**Language/Version**: TypeScript with Next.js application structure.

**Primary Dependencies**: Existing React/Phaser office UI, ProjectRegistryService, ProjectCompanyBindingService, ProjectBacklogService, ProjectBacklogDevelopmentBridgeService, BrowserOfficeSessionService, PortfolioOperationsService, external ADOS request/preparation/execution/status services, and live work visualization.

**Storage**: Existing browser office session snapshot.

**Testing**: Vitest unit/controller tests plus existing Playwright home-canvas smoke coverage run by ADOS after implementation.

**Target Platform**: Browser-based Next.js/Phaser management-game interface.

**Project Type**: Web application.

**Performance Goals**: Policy evaluation remains deterministic and synchronous over current project backlog-sized collections; no polling or unbounded loops.

**Constraints**: Mutate only the feature worktree; do not modify the primary repository; do not run the full configured ADOS validation pipeline here; do not start review, publish, merge, deploy, or mutate GitHub. Autonomy must fail closed and reuse Spec 142 bridge.

**Scale/Scope**: Project-scoped policies for registered projects, one autonomous execution per project, existing Ready backlog tasks only.

## Constitution Check

- Spec First: PASS. `spec.md` defines user value, scenarios, edge cases, requirements, and success criteria.
- Plan Before Code: PASS. This plan identifies affected services, persistence, UI, validation, and risks.
- Tasks Gate Implementation: PASS once `tasks.md` is generated before application code edits.
- Preserve Application Stability: PASS. Changes are scoped to policy/coordinator, office state/session, office backlog view, portfolio summary, and targeted tests.
- Validation Is Required: PASS. Targeted Vitest checks are run here; ADOS runs the authoritative full validation pipeline after implementation.

## Project Structure

### Documentation

```text
specs/144-controlled-autonomous-backlog-execution-policy/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- autonomous-execution-policy.md
`-- tasks.md
```

### Source Code

```text
src/features/city-view/scene/
|-- PortfolioOperationsService.ts
|-- PortfolioOperationsService.test.ts
`-- office/
    |-- OfficeProjectPortalController.ts
    |-- OfficeProjectPortalController.project-autonomy.test.ts
    |-- OfficeProjectPortalTypes.ts
    |-- OfficeProjectPortalView.ts
    |-- OfficeProjectPortalRegistry.ts
    |-- browser-session/
    |   |-- BrowserOfficeSessionService.ts
    |   |-- BrowserOfficeSessionService.test.ts
    |   `-- BrowserOfficeSessionTypes.ts
    `-- project-backlog/
        |-- ProjectAutonomousExecutionPolicyService.ts
        |-- ProjectAutonomousExecutionPolicyService.test.ts
        |-- ProjectAutonomousExecutionPolicyTypes.ts
        |-- ProjectBacklogDevelopmentBridgeService.ts
        |-- ProjectBacklogDevelopmentBridgeService.test.ts
        |-- ProjectBacklogService.ts
        `-- ProjectBacklogTypes.ts
```

**Structure Decision**: Keep autonomy in `project-backlog` because it governs Ready backlog task execution and composes existing project/backlog/bridge services. Persistence stays in browser session; UI remains inside the existing office planning surface; portfolio gets read-only derived status.

## Complexity Tracking

No constitution violations.
