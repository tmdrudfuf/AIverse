# Implementation Plan: Controlled Autonomous Suggestion Generation Policy

**Branch**: `codex/147-controlled-autonomous-suggestion-generation-policy` | **Date**: 2026-09-02 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/147-controlled-autonomous-suggestion-generation-policy/spec.md`

## Summary

Add a disabled-by-default, project-scoped Auto Suggestions policy that evaluates deterministic project state and may invoke the existing Spec 143 backlog suggestion generation flow once for an allowed bounded event. The feature persists cooldown/evaluation metadata, integrates compact controls into the existing office planning UI, exposes read-only portfolio status, and leaves Spec 145/146/144/142/ADOS boundaries untouched.

## Technical Context

**Language/Version**: TypeScript 5.8.3

**Primary Dependencies**: Next.js 16, React 19, Phaser 3.90, Vitest, Playwright

**Storage**: Existing browser office session localStorage snapshot

**Testing**: Targeted Vitest coverage and diff checks in this runtime; full configured ADOS validation remains ADOS-owned per handoff

**Target Platform**: Browser-based Next.js application

**Project Type**: Web application with Phaser office/city scenes and TypeScript service layer

**Performance Goals**: Automatic planning evaluation remains deterministic and bounded, invoking the suggestion provider at most once per eligible event and generating no more than the configured small limit.

**Constraints**: No scheduler, no polling, no recursive self-trigger, no new AI provider path, no backlog mutation, no Ready promotion, no execution/development/ADOS/Git/GitHub invocation.

**Scale/Scope**: Existing multi-project portfolio state and office project backlog/suggestion workflow.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Spec First: PASS. Spec 147 spec.md captures user value, acceptance criteria, boundaries, and edge cases.
- Plan Before Code: PASS. This plan defines affected areas and validation before source edits.
- Tasks Gate Implementation: PASS. Implementation begins after tasks.md is generated.
- Preserve Application Stability: PASS. Changes are scoped to project backlog policy/coordinator services, office portal state/UI, browser session persistence, portfolio summary, and tests.
- Validation Is Required: PASS. Targeted Vitest and diff checks will run in this runtime; full configured validation is intentionally left to ADOS per handoff.

## Project Structure

### Documentation (this feature)

```text
specs/147-controlled-autonomous-suggestion-generation-policy/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── autonomous-suggestion-generation-policy.md
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
        ├── ProjectAutonomousSuggestionCoordinator.ts
        ├── ProjectAutonomousSuggestionPolicyService.ts
        ├── ProjectAutonomousSuggestionPolicyTypes.ts
        └── ProjectAutonomousSuggestionPolicyService.test.ts
```

**Structure Decision**: Add Spec 147 beside existing Spec 144/145/146 policy services and reuse Spec 143 suggestion generation/persistence. Do not introduce another project registry, suggestion store, scheduler, provider abstraction, or execution bridge.

## Complexity Tracking

No constitution violations.
