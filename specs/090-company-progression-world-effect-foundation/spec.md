# Feature Specification: Company Progression World Effect Foundation

**Feature Branch**: `codex/090-company-progression-world-effect-foundation`

**Created**: 2026-08-12

**Status**: Draft

**Input**: User description: "Company Progression World Effect Foundation"

## Current Product Limitation

Company progression can produce level-up triggers and the city scene can expose a synchronized world-state snapshot. These foundations are not yet connected. A progression level-up that happens inside the company office is not represented as a world-state effect when the player returns to the city, so future systems cannot observe company growth as a world event without reaching back into office portal internals.

## User Scenarios & Testing

### User Story 1 - Represent Progression as World Effects (Priority: P1)

As a future world-state consumer, when the company reaches a new progression level, I can read a structured world effect that describes the reached company level and unlocked growth context.

**Why this priority**: This creates the stable effect shape downstream systems need before visual reactions, city unlocks, notifications, or persistence can be built safely.

**Independent Test**: Convert a level-up progression trigger into a world effect and confirm the effect includes copied level, stage, layout, capacity, unlocked zone, and milestone context.

**Acceptance Scenarios**:

1. **Given** a company level-up trigger, **When** world effects are created, **Then** one `company_progression_level_reached` effect is produced with the trigger id and reached-level context.
2. **Given** multiple progression triggers, **When** world effects are created, **Then** one effect is produced per trigger in the same order.
3. **Given** a consumer mutates a returned effect, **When** effects are requested again, **Then** the stored or source trigger data remains unchanged.

### User Story 2 - Include Effects in City World State (Priority: P2)

As the city scene, when synchronizing world state, I can include the latest company progression world effects alongside buildings and actors.

**Independent Test**: Synchronize a city world-state snapshot with progression effects and confirm the snapshot contains copied effects and treats changed effects as semantic world-state changes.

**Acceptance Scenarios**:

1. **Given** progression world effects are supplied during synchronization, **When** the world-state snapshot is created, **Then** the snapshot includes those effects.
2. **Given** identical buildings, actors, and effects are synchronized again, **When** semantic comparison runs, **Then** the previous snapshot is reused.
3. **Given** the effect list changes, **When** synchronization runs again, **Then** the world state reports a changed snapshot.

### User Story 3 - Carry Office Effects Back to City (Priority: P3)

As the simulation, when the player exits the office after company progression changed, the city receives those progression effects without adding visible UI.

**Independent Test**: Build an office return payload after progression triggers exist and confirm the city synchronizer receives the copied world effects.

**Acceptance Scenarios**:

1. **Given** the office portal has latest company progression triggers, **When** the player exits to the city, **Then** the return payload carries copied progression world effects.
2. **Given** no progression triggers are present, **When** the player exits to the city, **Then** the payload carries no effects.
3. **Given** the city scene starts from a return payload with effects, **When** it synchronizes world state, **Then** the latest city snapshot includes those effects.

### Edge Cases

- No progression triggers: no world effects are produced.
- Same-level or regressed progression: no world effects are produced because trigger creation already filters those cases.
- Multi-level jump: effects preserve trigger order so consumers can process reached levels predictably.
- Returned effect mutation: copies protect trigger source data and synchronizer state.
- Runtime handoff constraints: validation, review, publishing, merge, deployment, GitHub mutation, and primary-repository mutation remain outside this runtime.

## Requirements

### Functional Requirements

- **FR-001**: The system MUST define a copied, in-memory world effect record for company progression level-reached events.
- **FR-002**: The system MUST convert each company progression level-up trigger into exactly one world effect without changing trigger ordering.
- **FR-003**: A company progression world effect MUST include an effect id, effect type, source, trigger id, previous level, reached level, company stage, layout id, floor count, max employee count, unlocked zones, and reached milestone identifiers.
- **FR-004**: World-state snapshots MUST include a copied effect list in addition to existing world, building, and actor state.
- **FR-005**: World-state semantic comparison MUST treat effect changes as world-state changes while reusing the previous snapshot when effects are unchanged.
- **FR-006**: Office-to-city return payloads MUST be able to carry copied progression world effects from the office portal to the city scene.
- **FR-007**: The feature MUST NOT add visible UI, persistence, network calls, review automation, publishing, deployment, GitHub mutation, or primary-repository mutation.

### Key Entities

- **Company Progression World Effect**: A world-state-visible projection of a company progression level-up trigger.
- **World State Snapshot Effects**: The copied list of current world effects stored with the synchronized city snapshot.
- **Office Return Effects**: The copied effect handoff carried from the office scene back to the city scene.

## Success Criteria

### Measurable Outcomes

- **SC-001**: One level-up trigger produces exactly one world effect with the reached-level context.
- **SC-002**: Three ordered level-up triggers produce exactly three ordered world effects.
- **SC-003**: A world-state snapshot synchronized with effects exposes those effects without allowing returned-object mutation to affect stored state.
- **SC-004**: Re-synchronizing unchanged effects reports no semantic change, while synchronizing a different effect list reports a changed snapshot.
- **SC-005**: Office exit can hand company progression effects back to the city without changing visible controls or dashboard rendering.

## Assumptions

- Effects are in-memory only and represent the latest office-to-city handoff; durable event history is follow-up scope.
- Existing company progression triggers remain the source of truth for level-up detection.
- The city world-state snapshot is the correct foundation boundary for future world reactions.
