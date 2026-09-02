# Tasks: Controlled AI Suggestion Acceptance Policy

## Phase 1: Setup

- [X] T001 Create Spec 145 spec, plan, research, data model, contract, quickstart, and tasks files in specs/145-controlled-ai-suggestion-acceptance-policy/
- [X] T002 Update .specify/feature.json and AGENTS.md Spec Kit pointer to specs/145-controlled-ai-suggestion-acceptance-policy/plan.md

## Phase 2: Foundational

- [X] T003 Add backlog suggestion acceptance policy types in src/features/city-view/scene/office/project-backlog/ProjectBacklogSuggestionAcceptancePolicyTypes.ts
- [X] T004 Add deterministic policy/coordinator service in src/features/city-view/scene/office/project-backlog/ProjectBacklogSuggestionAcceptancePolicyService.ts
- [X] T005 Extend suggestion and backlog provenance fields in src/features/city-view/scene/office/project-backlog/ProjectBacklogTypes.ts and ProjectBacklogSuggestionTypes.ts

## Phase 3: User Story 1 - Explicit Project Auto-Accept

- [X] T006 [US1] Add policy service tests for default disabled, priority filtering, deterministic selection, same-project ownership, bounded acceptance, and backlog-only task state in src/features/city-view/scene/office/project-backlog/ProjectBacklogSuggestionAcceptancePolicyService.test.ts
- [X] T007 [US1] Wire controller policy actions and auto-evaluation after explicit suggestion generation in src/features/city-view/scene/office/OfficeProjectPortalController.ts
- [X] T008 [US1] Add compact office controls and probe attributes in src/features/city-view/scene/office/CompanyOfficeScene.ts and OfficeProjectPortalView.ts

## Phase 4: User Story 2 - Safety and Idempotency

- [X] T009 [US2] Add tests for rejected, accepted, stale, malformed, cross-project, duplicate, disconnected, reload, and active execution no-op behavior in ProjectBacklogSuggestionAcceptancePolicyService.test.ts and OfficeProjectPortalController.project-backlog-suggestions.test.ts
- [X] T010 [US2] Persist policy/provenance through browser session state in src/features/city-view/scene/office/browser-session/BrowserOfficeSessionTypes.ts and BrowserOfficeSessionService.ts

## Phase 5: User Story 3 - Auditability and Persistence

- [X] T011 [US3] Add browser session tests for project-scoped acceptance policies and provenance in src/features/city-view/scene/office/browser-session/BrowserOfficeSessionService.test.ts
- [X] T012 [US3] Add read-only portfolio AI Accept summary in src/features/city-view/scene/PortfolioOperationsService.ts and PortfolioOperationsService.test.ts

## Phase 6: Validation

- [X] T013 Run targeted Vitest coverage for changed services/controllers/session/portfolio
- [X] T014 Leave full ADOS validation pipeline to authoritative ADOS runtime per handoff
- [X] T015 Add two-project runtime evidence artifacts for Requirement 32 in specs/145-controlled-ai-suggestion-acceptance-policy/runtime-evidence.json and runtime-verification.md

## Dependencies

User Story 1 and 2 depend on Phase 2. User Story 3 depends on persisted policy state from User Story 2.
