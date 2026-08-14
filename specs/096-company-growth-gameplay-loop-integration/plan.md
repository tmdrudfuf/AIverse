# Implementation Plan: Spec 096 - Company Growth Gameplay Loop Integration

**Branch**: `codex/096-company-growth-gameplay-loop-integration` | **Date**: 2026-08-13 | **Spec**: `specs/096-company-growth-gameplay-loop-integration/spec.md`

**Input**: Feature specification from `/specs/096-company-growth-gameplay-loop-integration/spec.md`

## Summary

Centralize the company growth gameplay chain into one pure service that consumes current company progression triggers and returns copied triggers, world effects, rewards, and event feed entries. Wire `OfficeProjectPortalController` to expose that result and update `CompanyOfficeScene` so office exit handoff consumes the loop result instead of constructing the world-state chain inline.

## Technical Context

**Language/Version**: TypeScript 5.8, Next.js 16, Phaser 3.90, Vitest

**Primary Dependencies**: existing `CompanyProgressionTriggerService`, `CompanyProgressionWorldEffectService`, `CompanyProgressionRewardService`, `CompanyProgressionEventFeedService`, `OfficeProjectPortalController`, `CompanyOfficeScene`, and `OfficeExitController`

**Storage**: none; derived in-memory loop result only

**Testing**: focused Vitest unit coverage for the pure gameplay loop service and copied controller accessor behavior; ADOS validation runs outside this runtime

**Target Platform**: browser-based AIverse app

**Project Type**: Next.js application with Phaser city/office interaction surface

**Performance Goals**: O(number of current progression triggers); expected trigger lists are small and bounded by company level count

**Constraints**: Mutate only the feature worktree. Do not run validation, start review, publish, merge, deploy, mutate GitHub, or modify the primary repository from this runtime.

**Scale/Scope**: Existing office/city progression handoff only; no persistence, new UI, new art, animation, runtime execution, review automation, validation execution, or GitHub integration changes

## Constitution Check

- Spec exists before plan and implementation.
- Plan names affected source/test surfaces before code changes.
- Tasks will be created before implementation edits.
- Application changes stay scoped to company growth loop result derivation and office exit handoff wiring.
- Validation commands are documented but intentionally not run from this ADOS handoff runtime.

## Project Structure

### Documentation (this feature)

```text
specs/096-company-growth-gameplay-loop-integration/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- company-growth-gameplay-loop.md
|-- checklists/
|   `-- requirements.md
`-- tasks.md
```

### Source Code (repository root)

```text
src/features/city-view/scene/office/progression/
|-- CompanyGrowthGameplayLoopService.ts
`-- CompanyGrowthGameplayLoopService.test.ts

src/features/city-view/scene/office/
|-- OfficeProjectPortalController.ts
`-- CompanyOfficeScene.ts
```

**Structure Decision**: Place the loop service in `office/progression/` because it is initiated from office progression triggers, while reusing existing world-state services as dependencies. Keep scene changes limited to replacing inline service construction with the portal controller's copied loop result.

## Design

`CompanyGrowthGameplayLoopService` exposes `createLoopResult(input)` where `input.triggers` is the current trigger list. The service copies triggers, derives world effects from triggers, derives rewards from effects, derives feed events from rewards, then returns fresh arrays.

`OfficeProjectPortalController.getCompanyGrowthGameplayLoopResult()` reads the stored `companyProgressionTriggers`, invokes the service, and returns a copied result. `CompanyOfficeScene` requests that result when the player presses the action key at the exit, then passes `effects`, `rewards`, and `eventFeed` into `OfficeExitController.createReturnPayload()`.

## Validation

Focused validation, outside this runtime:

```powershell
npm test -- CompanyGrowthGameplayLoopService OfficeProjectPortalController.company-influence
```

Full ADOS validation, outside this runtime:

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```
