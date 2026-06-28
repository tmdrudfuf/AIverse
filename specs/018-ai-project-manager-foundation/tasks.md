# Tasks: AI Project Manager Foundation

## Phase 1: Setup
- [x] T001 Update active Spec Kit pointers for specs/018-ai-project-manager-foundation in .specify/feature.json and AGENTS.md

## Phase 2: Foundation
- [x] T002 Add project-manager result models in src/features/city-view/scene/office/ai/AIProjectManagerTypes.ts
- [x] T003 Implement AIProjectManagerService depending on AIService in src/features/city-view/scene/office/ai/AIProjectManagerService.ts

## Phase 3: User Story 1 - Prepare Hidden Project Manager Output
- [x] T004 Extend ProjectPortalState with projectManagementSuggestions in src/features/city-view/scene/office/OfficeProjectPortalTypes.ts
- [x] T005 Initialize projectManagementSuggestions in src/features/city-view/scene/office/OfficeProjectPortalRegistry.ts
- [x] T006 Wire AIProjectManagerService into src/features/city-view/scene/office/OfficeProjectPortalController.ts
- [x] T007 Prepare hidden project-manager output from project, task, employee, and activity data in src/features/city-view/scene/office/OfficeProjectPortalController.ts
- [x] T008 Preserve existing UI by avoiding Phaser view changes in src/features/city-view/scene/office/OfficeProjectPortalView.ts

## Phase 4: Validation and Review
- [x] T009 Run npx tsc --noEmit
- [x] T010 Run npm run build
- [x] T011 Run npm run lint if available (attempted; script exits because next lint is not usable in this Next.js setup)
- [x] T012 Run git diff --check
- [x] T013 Review architecture checklist: no external calls, no provider leakage, project manager depends on AIService, existing gameplay unchanged