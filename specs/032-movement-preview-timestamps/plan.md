# Implementation Plan: Movement Preview Timestamp Consistency

**Branch**: `codex/movement-preview-timestamps`
**Spec**: `specs/032-movement-preview-timestamps/spec.md`

## Summary

Replace the fixed preview timestamp fallback in `OfficeProjectPortalController` with a small helper that derives the preview timestamp from existing movement snapshots and persisted employee simulation snapshots. Add focused regression coverage in the employee AI integration test.

## Technical Context

- TypeScript / Next.js / Vitest project.
- Relevant code:
  - `src/features/city-view/scene/office/OfficeProjectPortalController.ts`
  - `src/features/city-view/scene/office/npc/EmployeeNpcMovementService.ts`
  - `src/features/city-view/scene/office/OfficeProjectPortalController.employee-ai.test.ts`
- Existing movement preview logic is read-only through `EmployeeNpcMovementService.previewSnapshots`.

## Architecture Fit

The change extends the existing portal controller timestamp strategy without adding new state or services. It reuses existing movement and employee simulation snapshots as the source of truth.

## Validation

- `npm test`
- `npx tsc --noEmit`
- `npm run build`
- `git diff --check`
- `git diff --cached --check`

## Risks

- If preview timestamps are not shared consistently across preview helpers, Employee AI and Insight/Knowledge may disagree about movement state.
- Using current time as a last resort is acceptable only when no movement or simulation timestamp exists.
