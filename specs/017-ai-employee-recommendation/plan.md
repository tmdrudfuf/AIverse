# Implementation Plan: AI Employee Recommendation

## Summary
Update the AI recommendation result model and prepare hidden employee recommendations through AIService when tasks are selected or analyzed and employees are available. Do not render recommendations or change manual assignment behavior.

## Technical Context
- Next.js, TypeScript, Phaser project.
- OfficeProjectPortalController owns state and already prepares hidden task analyses.
- AIService already depends on AIProvider and MockAIProvider provides deterministic local responses.
- Phaser view remains presentational and unchanged.

## Constitution Check
- Spec, plan, and tasks exist before implementation.
- Controller uses AIService only.
- Phaser remains view-only.
- No external APIs, new dependencies, secrets, automatic assignment, or UI changes.

## Architecture
- Update EmployeeRecommendationResult in AI types.
- Keep AIProvider and AIService recommendation method but align return type shape.
- Update MockAIProvider recommendation logic to return deterministic recommended/alternative ids.
- Extend ProjectPortalState with employeeRecommendations: Record<string, EmployeeRecommendationResult>.
- Prepare recommendations when employees load and when selected task analysis/selection runs.
- Use stale guards mirroring hidden analysis state.

## Affected Files
- src/features/city-view/scene/office/ai/AITypes.ts
- src/features/city-view/scene/office/ai/MockAIProvider.ts
- src/features/city-view/scene/office/OfficeProjectPortalTypes.ts
- src/features/city-view/scene/office/OfficeProjectPortalRegistry.ts
- src/features/city-view/scene/office/OfficeProjectPortalController.ts

## Validation
- npx tsc --noEmit
- npm run build
- npm run lint if available
- git diff --check
- Regression review for Project Portal, Task Detail, Employee Assignment, Work Session, Activity Log