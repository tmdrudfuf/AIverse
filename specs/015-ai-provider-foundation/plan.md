# Implementation Plan: AI Provider Foundation

## Summary
Add an isolated AI provider/service foundation for future company operations. The first integration point routes Start Work activity-message creation through AIService while preserving the existing local placeholder behavior.

## Technical Context
- Next.js, TypeScript, Phaser project.
- Office project portal controller owns state transitions.
- Phaser view remains presentational only.
- Existing task, employee, and work-session domains use provider/service patterns.

## Constitution Check
- Spec exists before implementation.
- Plan exists before code changes.
- Tasks exist before implementation.
- Change is isolated to office AI foundation and one safe controller integration.
- No external APIs, secrets, environment variables, or new dependencies.

## Architecture
- Add src/features/city-view/scene/office/ai/ with AIProvider, MockAIProvider, AIService, and AITypes.
- AIService depends only on AIProvider.
- OfficeProjectPortalController owns minimal service wiring and calls AIService for work-start activity message generation.
- MockAIProvider returns deterministic local results.

## Affected Files
- src/features/city-view/scene/office/ai/AITypes.ts
- src/features/city-view/scene/office/ai/AIProvider.ts
- src/features/city-view/scene/office/ai/MockAIProvider.ts
- src/features/city-view/scene/office/ai/AIService.ts
- src/features/city-view/scene/office/OfficeProjectPortalController.ts

## Validation
- npx tsc --noEmit
- npm run build
- npm run lint if available
- git diff --check
- Review checklist from Phase 21 request