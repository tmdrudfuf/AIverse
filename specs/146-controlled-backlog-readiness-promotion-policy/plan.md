# Implementation Plan: Controlled Backlog Readiness Promotion Policy

**Branch**: `codex/146-controlled-backlog-readiness-promotion-policy` | **Date**: 2026-09-02 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/146-controlled-backlog-readiness-promotion-policy/spec.md`

## Summary

Add a disabled-by-default, project-scoped Auto Ready policy that evaluates existing Spec 141 backlog tasks and promotes only valid, same-project eligible tasks to Ready through the existing backlog update path. The feature integrates with existing office controls, browser session persistence, and portfolio summaries while remaining independent from Spec 145 suggestion acceptance and Spec 144 autonomous execution.

## Technical Context

**Language/Version**: TypeScript 5.8.3

**Primary Dependencies**: Next.js 16, React 19, Phaser 3.90, Vitest, Playwright

**Storage**: Existing browser office session localStorage snapshot

**Testing**: Vitest targeted unit tests; existing Playwright home canvas command remains ADOS-owned for full validation

**Target Platform**: Browser-based Next.js application

**Project Type**: Web application with Phaser office/city scenes and TypeScript service layer

**Performance Goals**: Readiness evaluation remains deterministic and bounded, evaluating only current project task collections and promoting at most the configured small limit.

**Constraints**: No new scheduler, no continuous polling, no AI decision call, no ADOS/Codex/Claude/Git/GitHub invocation, no second backlog store.

**Scale/Scope**: Existing multi-project portfolio state and office backlog workflow.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Spec First: PASS. Spec 146 spec.md exists and captures user value, acceptance criteria, boundaries, and edge cases.
- Plan Before Code: PASS. This plan defines affected areas and validation before source edits.
- Tasks Gate Implementation: PASS. Implementation begins after tasks.md is generated.
- Preserve Application Stability: PASS. Changes are scoped to project backlog services, office portal state/UI, browser session persistence, portfolio summary, and tests.
- Validation Is Required: PASS. Targeted Vitest and diff checks will run in this runtime; full configured validation is intentionally left to ADOS per handoff.

## Project Structure

### Documentation (this feature)

```text
specs/146-controlled-backlog-readiness-promotion-policy/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── backlog-readiness-promotion-policy.md
└── tasks.md
```

### Source Code (repository root)

```text
src/features/city-view/scene/
├── PortfolioOperationsService.ts
└── office/
    ├── CompanyOfficeScene.ts
    ├── OfficeProjectPortalController.ts
    ├── OfficeProjectPortalRegistry.ts
    ├── OfficeProjectPortalTypes.ts
    ├── OfficeProjectPortalView.ts
    ├── browser-session/
    │   ├── BrowserOfficeSessionService.ts
    │   └── BrowserOfficeSessionTypes.ts
    └── project-backlog/
        ├── ProjectBacklogReadinessPromotionPolicyService.ts
        ├── ProjectBacklogReadinessPromotionPolicyTypes.ts
        └── ProjectBacklogReadinessPromotionPolicyService.test.ts
```

**Structure Decision**: Add the service beside existing project backlog policy services and extend existing portal/session/portfolio surfaces. Do not introduce another task store or execution coordinator.

## Complexity Tracking

No constitution violations.
