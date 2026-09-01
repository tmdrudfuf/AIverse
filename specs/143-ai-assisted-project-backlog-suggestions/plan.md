# Implementation Plan: AI-Assisted Project Backlog Suggestions

**Branch**: `codex/143-ai-assisted-project-backlog-suggestions` | **Date**: 2026-08-31 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/143-ai-assisted-project-backlog-suggestions/spec.md`

## Summary

Add project-scoped AI-assisted backlog suggestions to the existing office project backlog surface. A focused provider-neutral suggestion service will build deterministic project-only context, validate structured provider output, filter duplicates, persist candidates in browser office session state, and create existing Spec 141 backlog tasks only when the operator accepts a candidate.

## Technical Context

**Language/Version**: TypeScript, React/Next.js, Phaser

**Primary Dependencies**: Existing ProjectRegistryService, ProjectCompanyBindingService, ProjectBacklogService, BrowserOfficeSessionService, OfficeProjectPortalController/View, PortfolioOperationsService, and external ADOS/request state types.

**Storage**: Existing browser office session local storage snapshot keyed by canonical project id, extended with project backlog suggestion collections.

**Testing**: Focused Vitest service/controller/view/session coverage plus documented runtime verification; ADOS will run authoritative full validation outside this runtime.

**Target Platform**: Browser application with Phaser city/office runtime.

**Project Type**: Web application with Phaser scene runtime.

**Performance Goals**: Suggestion context collection and duplicate filtering remain synchronous and cheap for small project/backlog collections displayed in the office.

**Constraints**: Mutate only this feature worktree; do not modify the primary repository; do not run the full configured ADOS validation pipeline here; do not start review, publish, merge, deploy, or mutate GitHub. Suggestion generation must be read/advisory only and must not add shell repository crawling, execution engines, or project-specific hacks.

**Scale/Scope**: Multiple registered/bound projects, each with independent suggestion candidate history, backlog acceptance, rejection history, reload persistence, and subtle portfolio counts.

## Constitution Check

- Spec First: PASS. `spec.md` captures user flows, acceptance criteria, edge cases, safety requirements, and measurable outcomes.
- Plan Before Code: PASS. This plan identifies existing services and affected files before implementation.
- Tasks Gate Implementation: PASS after `tasks.md` exists and is aligned.
- Preserve Application Stability: PASS. Changes are scoped to suggestion types/service, existing session persistence, office portal state/controller/view, portfolio summary, and tests.
- Validation Is Required: PASS. Targeted tests and diff checks will be run here as feasible; handoff explicitly defers the full ADOS validation pipeline.

## Project Structure

### Documentation (this feature)

```text
specs/143-ai-assisted-project-backlog-suggestions/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- runtime-verification.md
|-- contracts/
|   `-- backlog-suggestions.md
|-- checklists/
|   `-- requirements.md
`-- tasks.md
```

### Source Code (repository root)

```text
src/features/city-view/scene/
|-- PortfolioOperationsService.ts
|-- PortfolioOperationsService.test.ts
`-- office/
    |-- OfficeProjectPortalController.ts
    |-- OfficeProjectPortalController.project-backlog-suggestions.test.ts
    |-- OfficeProjectPortalView.ts
    |-- OfficeProjectPortalView.test.ts
    |-- OfficeProjectPortalTypes.ts
    |-- browser-session/
    |   |-- BrowserOfficeSessionService.ts
    |   |-- BrowserOfficeSessionService.test.ts
    |   `-- BrowserOfficeSessionTypes.ts
    `-- project-backlog/
        |-- ProjectBacklogSuggestionService.ts
        |-- ProjectBacklogSuggestionService.test.ts
        |-- ProjectBacklogSuggestionTypes.ts
        |-- ProjectBacklogService.ts
        `-- ProjectBacklogTypes.ts
```

**Structure Decision**: Add a focused suggestion service beside the existing backlog service and wire it through the existing office portal controller. Reuse Spec 141 backlog persistence and Spec 142 state as read-only context.

## Complexity Tracking

No constitution violations.
