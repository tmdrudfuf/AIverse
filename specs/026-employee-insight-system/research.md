# Research: Employee Insight System

## Decision: Add a feature-local office insight module

**Rationale**: Employee Insight is specific to the office scene and depends on office employee NPC, schedule, task, and progression state. A feature-local `src/features/city-view/scene/office/insight/` folder keeps the work close to its consumers without introducing a premature global UI or simulation package.

**Alternatives considered**: Extending the existing conversation module was rejected because insight is passive and must not own dialogue behavior. Adding a global engine overlay package was rejected until multiple scenes need the same card pattern.

## Decision: Derive insight from existing composed office state

**Rationale**: `OfficeProjectPortalController` already composes employees, tasks, Employee AI snapshots, movement, workstation, schedule, progression, and layout data. Exposing read-only insight source data from the controller avoids duplicate derivation and keeps existing service ownership intact.

**Alternatives considered**: Querying individual services from `CompanyOfficeScene` was rejected because it would spread office state composition across scene code. Storing separate insight state was rejected because the card should reflect current runtime state and not persist.

## Decision: Use deterministic local Thinking sentences

**Rationale**: The specification asks for one short Thinking sentence but also requires reusing existing systems. A deterministic sentence derived from current task/project/AI state avoids new AI calls, external services, or provider leakage.

**Alternatives considered**: Calling an AI provider was rejected because this feature is observational and should remain lightweight. Reusing dialogue text was rejected because insight must not become dialogue.

## Decision: Render one non-blocking screen-space card

**Rationale**: One card prevents visual clutter and supports nearest-employee selection. Screen-space rendering keeps the card readable while the camera follows the player.

**Alternatives considered**: World-space labels above every NPC were rejected because they clutter the office and do not satisfy the single-card detail requirement. A modal was rejected because it would block movement.

## Decision: Keep dialogue extensibility as a boundary, not an implementation

**Rationale**: Future dialogue can consume the same selected employee or source context later, but this feature should not introduce dialogue triggers, prompts, or interaction flow. The insight service should expose passive observation data only.

**Alternatives considered**: Sharing conversation target methods directly was rejected because existing conversation proximity is slot-based and dialogue-oriented. Employee Insight should have its own passive selection contract that can be adapted later.
