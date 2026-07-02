# Implementation Plan: AI Project Manager Foundation

## Summary
Add an AIProjectManagerService layer above AIService to produce hidden local project-management output: project health, risks, and next-action recommendation. Store output in portal state without rendering it or changing gameplay.

## Technical Context
- Next.js, TypeScript, Phaser project.
- OfficeProjectPortalController manages portal state.
- AIService already wraps AIProvider and MockAIProvider through a factory.
- Phaser view remains presentational and unchanged.

## Constitution Check
- Spec, plan, and tasks exist before implementation.
- Controllers may call AIProjectManagerService.
- AIProjectManagerService depends on AIService, not provider implementations.
- No external APIs, new dependencies, UI changes, or gameplay changes.

## Architecture
- Add AIProjectManagerTypes.ts for project-level result models.
- Add AIProjectManagerService.ts under the office AI folder.
- Extend ProjectPortalState with projectManagementSuggestions keyed by project id.
- Prepare hidden project-manager output when project workspace/tasks/employees become available or local task state changes.
- Use request-version guards to prevent stale async writes after close/destroy/project navigation.

## Affected Files
- src/features/city-view/scene/office/ai/AIProjectManagerTypes.ts
- src/features/city-view/scene/office/ai/AIProjectManagerService.ts
- src/features/city-view/scene/office/OfficeProjectPortalTypes.ts
- src/features/city-view/scene/office/OfficeProjectPortalRegistry.ts
- src/features/city-view/scene/office/OfficeProjectPortalController.ts

## Validation
- npx tsc --noEmit
- npm run build
- npm run lint if available
- git diff --check
- Regression review for Project Portal, Project Selection, Task Detail, Employee Assignment, Work Session start/complete, Activity Log