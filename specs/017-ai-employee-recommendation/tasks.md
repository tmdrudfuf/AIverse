# Tasks: AI Employee Recommendation

## Phase 1: Setup
- [x] T001 Update active Spec Kit pointers for specs/017-ai-employee-recommendation in .specify/feature.json and AGENTS.md

## Phase 2: Foundation
- [x] T002 Update EmployeeRecommendationResult model in src/features/city-view/scene/office/ai/AITypes.ts
- [x] T003 Confirm AIProvider recommendation contract in src/features/city-view/scene/office/ai/AIProvider.ts
- [x] T004 Confirm AIService recommendation API in src/features/city-view/scene/office/ai/AIService.ts
- [x] T005 Implement deterministic MockAIProvider recommendation result shape in src/features/city-view/scene/office/ai/MockAIProvider.ts

## Phase 3: User Story 1 - Prepare Hidden Recommendations
- [x] T006 Extend ProjectPortalState with employeeRecommendations in src/features/city-view/scene/office/OfficeProjectPortalTypes.ts
- [x] T007 Initialize employeeRecommendations in src/features/city-view/scene/office/OfficeProjectPortalRegistry.ts
- [x] T008 Prepare employee recommendations through AIService when selected tasks and employees are available in src/features/city-view/scene/office/OfficeProjectPortalController.ts
- [x] T009 Trigger recommendation preparation after employee load and selected task changes in src/features/city-view/scene/office/OfficeProjectPortalController.ts
- [x] T010 Preserve existing assignment behavior and avoid UI changes in src/features/city-view/scene/office/OfficeProjectPortalView.ts

## Phase 4: Validation and Review
- [x] T011 Run npx tsc --noEmit
- [x] T012 Run npm run build
- [x] T013 Run npm run lint if available (attempted; script exits because next lint is not usable in this Next.js setup)
- [x] T014 Run git diff --check
- [x] T015 Review architecture checklist: Phaser view-only, controller uses AIService only, no provider leakage, no external APIs, existing assignment/work-session/activity behavior unchanged