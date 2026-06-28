# Tasks: AI Provider Foundation

## Phase 1: Setup
- [x] T001 Create AI foundation folder at src/features/city-view/scene/office/ai

## Phase 2: Foundation
- [x] T002 [P] Define AI domain result/input models in src/features/city-view/scene/office/ai/AITypes.ts
- [x] T003 [P] Define AIProvider interface in src/features/city-view/scene/office/ai/AIProvider.ts
- [x] T004 Implement AIService depending only on AIProvider in src/features/city-view/scene/office/ai/AIService.ts
- [x] T005 Implement deterministic MockAIProvider in src/features/city-view/scene/office/ai/MockAIProvider.ts

## Phase 3: User Story 1 - Local AI Foundation
- [x] T006 [US1] Wire AIService into src/features/city-view/scene/office/OfficeProjectPortalController.ts
- [x] T007 [US1] Route Start Work activity-message generation through AIService in src/features/city-view/scene/office/OfficeProjectPortalController.ts
- [x] T008 [US1] Preserve work-session, task status, employee status, and activity-log behavior in src/features/city-view/scene/office/OfficeProjectPortalController.ts

## Phase 4: Validation and Review
- [x] T009 Run npx tsc --noEmit
- [x] T010 Run npm run build
- [x] T011 Run npm run lint if available (attempted; script exits because next lint is not usable in this Next.js setup)
- [x] T012 Run git diff --check
- [x] T013 Review architecture checklist: Phaser view-only, controllers use services, AIService depends only on AIProvider, no external APIs