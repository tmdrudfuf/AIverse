# Implementation Plan: AI Task Analysis

## Summary
Extend the local AI foundation with a richer TaskAnalysis model and prepare analyses for tasks through AIService. Store analyses in portal state by task id without rendering them or changing gameplay flow.

## Technical Context
- Next.js, TypeScript, Phaser project.
- OfficeProjectPortalController manages state and task selection.
- OfficeProjectPortalView remains presentational and must not render analysis yet.
- AIService already depends on AIProvider and is wired in the controller.

## Constitution Check
- Spec, plan, and tasks exist before implementation.
- Controller uses AIService only.
- Phaser remains view-only.
- No external API calls, secrets, new dependencies, or UI changes.

## Architecture
- Add TaskAnalysis model to AI types.
- Update AIProvider and AIService analyzeTask to return TaskAnalysis.
- Update MockAIProvider with deterministic analysis logic.
- Extend ProjectPortalState with taskAnalyses: Record<string, TaskAnalysis>.
- Prepare analyses after task collections load/reuse and when task selection changes/opening detail.
- Use stale guards for async analysis application.

## Affected Files
- src/features/city-view/scene/office/ai/AITypes.ts
- src/features/city-view/scene/office/ai/AIProvider.ts
- src/features/city-view/scene/office/ai/AIService.ts
- src/features/city-view/scene/office/ai/MockAIProvider.ts
- src/features/city-view/scene/office/ai/MockAIServiceFactory.ts
- src/features/city-view/scene/office/OfficeProjectPortalTypes.ts
- src/features/city-view/scene/office/OfficeProjectPortalRegistry.ts
- src/features/city-view/scene/office/OfficeProjectPortalController.ts

## Validation
- npx tsc --noEmit
- npm run build
- npm run lint if available
- git diff --check
- Regression review for Project Portal, Task Detail, Employee Assignment, Work Session, Activity Log