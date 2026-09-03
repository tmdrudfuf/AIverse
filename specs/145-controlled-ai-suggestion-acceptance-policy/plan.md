# Implementation Plan: Controlled AI Suggestion Acceptance Policy

**Branch**: `codex/145-controlled-ai-suggestion-acceptance-policy` | **Date**: 2026-09-01 | **Spec**: [spec.md](./spec.md)

## Summary

Add a project-scoped deterministic auto-acceptance policy for existing AI backlog suggestions. The policy evaluates persisted Spec 143 suggestions, reuses the manual suggestion-to-backlog conversion primitive, persists provenance, and stops at backlog creation without marking tasks Ready or invoking execution paths.

## Technical Context

**Language/Version**: TypeScript with Next.js application structure.

**Primary Dependencies**: Existing React/Phaser office UI, ProjectRegistryService, ProjectCompanyBindingService, ProjectBacklogService, ProjectBacklogSuggestionService, BrowserOfficeSessionService, PortfolioOperationsService, and Spec 144 autonomy services as a separate boundary.

**Storage**: Existing browser office session snapshot.

**Testing**: Vitest unit/controller tests. ADOS runs authoritative full validation after implementation.

**Target Platform**: Browser-based Next.js/Phaser management-game interface.

**Constraints**: Mutate only the feature worktree; do not modify the primary repository; do not run the full configured ADOS validation pipeline here; do not start review, publish, merge, deploy, or mutate GitHub. Suggestion acceptance must fail closed and must not invoke execution.

## Constitution Check

- Spec First: PASS.
- Plan Before Code: PASS.
- Tasks Gate Implementation: PASS once `tasks.md` is generated.
- Preserve Application Stability: PASS. Changes are scoped to suggestion acceptance policy, provenance, persistence, office backlog view, portfolio summary, and targeted tests.
- Validation Is Required: PASS. Targeted tests are run here; ADOS runs authoritative validation.

## Project Structure

```text
specs/145-controlled-ai-suggestion-acceptance-policy/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- suggestion-acceptance-policy.md
`-- tasks.md

src/features/city-view/scene/
|-- PortfolioOperationsService.ts
`-- office/
    |-- OfficeProjectPortalController.ts
    |-- OfficeProjectPortalView.ts
    |-- CompanyOfficeScene.ts
    |-- browser-session/
    |   |-- BrowserOfficeSessionService.ts
    |   `-- BrowserOfficeSessionTypes.ts
    `-- project-backlog/
        |-- ProjectBacklogSuggestionAcceptancePolicyService.ts
        |-- ProjectBacklogSuggestionAcceptancePolicyTypes.ts
        |-- ProjectBacklogSuggestionService.ts
        |-- ProjectBacklogSuggestionTypes.ts
        |-- ProjectBacklogService.ts
        `-- ProjectBacklogTypes.ts
```

## Complexity Tracking

No constitution violations.
