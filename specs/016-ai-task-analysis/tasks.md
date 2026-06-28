# Tasks: AI Task Analysis

## Phase 1: Setup
- [x] T001 Update active Spec Kit pointers for specs/016-ai-task-analysis in .specify/feature.json and AGENTS.md

## Phase 2: Foundation
- [x] T002 [P] Add TaskAnalysis model fields in src/features/city-view/scene/office/ai/AITypes.ts
- [x] T003 Update AIProvider analyzeTask return type in src/features/city-view/scene/office/ai/AIProvider.ts
- [x] T004 Update AIService analyzeTask return type in src/features/city-view/scene/office/ai/AIService.ts
- [x] T005 Implement deterministic MockAIProvider task analysis in src/features/city-view/scene/office/ai/MockAIProvider.ts

## Phase 3: User Story 1 - Prepare Local AI Analysis
- [x] T006 Extend ProjectPortalState with taskAnalyses in src/features/city-view/scene/office/OfficeProjectPortalTypes.ts
- [x] T007 Initialize taskAnalyses in src/features/city-view/scene/office/OfficeProjectPortalRegistry.ts
- [x] T008 Prepare task analyses through AIService after task load/reuse in src/features/city-view/scene/office/OfficeProjectPortalController.ts
- [x] T009 Prepare selected task analysis through AIService on task selection/detail open in src/features/city-view/scene/office/OfficeProjectPortalController.ts
- [x] T010 Preserve existing UI by avoiding Task Detail rendering changes in src/features/city-view/scene/office/OfficeProjectPortalView.ts

## Phase 4: Validation and Review
- [x] T011 Run npx tsc --noEmit
- [x] T012 Run npm run build
- [x] T013 Run npm run lint if available (attempted; script exits because next lint is not usable in this Next.js setup)
- [x] T014 Run git diff --check
- [x] T015 Review architecture checklist: Phaser view-only, controller uses AIService only, no provider direct calls for analysis, no external APIs, existing work-session flow unchanged