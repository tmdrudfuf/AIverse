# Feature Specification: Company Progression Reward Foundation

**Feature Branch**: `codex/091-company-progression-reward-foundation`

**Created**: 2026-08-12

**Status**: Draft

**Input**: User description: "Company Progression Reward Foundation"

## Current Product Limitation

Company progression can emit level-up triggers and carry copied world effects from the office back to the city. The system still has no stable reward record for what a level-up granted. Future reward displays, history, notifications, and office/city reactions would need to infer rewards directly from effect details, which risks duplicated logic and inconsistent copy behavior.

## User Scenarios & Testing

### User Story 1 - Represent Progression Rewards (Priority: P1)

As a future reward consumer, when company progression reaches a new level, I can read a copied reward record that describes the granted growth benefits.

**Why this priority**: Reward records are the foundation future notifications, history, animations, and visible reward presentation need before any user-facing reward UI is introduced.

**Independent Test**: Convert one progression world effect into one reward and confirm the reward includes copied level, stage, capacity, unlocked-zone, and milestone context.

**Acceptance Scenarios**:

1. **Given** a company progression world effect, **When** rewards are created, **Then** one `company_progression_reward_granted` record is produced with the source effect id and reached-level reward context.
2. **Given** multiple progression world effects, **When** rewards are created, **Then** one reward is produced per effect in the same order.
3. **Given** a consumer mutates a returned reward, **When** rewards are requested again, **Then** source effect data and previously stored reward data remain unchanged.

### User Story 2 - Include Rewards in City World State (Priority: P2)

As the city scene, when synchronizing world state, I can include latest company progression rewards alongside buildings, actors, and effects.

**Independent Test**: Synchronize a city world-state snapshot with rewards and confirm the snapshot contains copied rewards and treats changed rewards as semantic world-state changes.

**Acceptance Scenarios**:

1. **Given** progression rewards are supplied during synchronization, **When** the world-state snapshot is created, **Then** the snapshot includes those rewards.
2. **Given** identical buildings, actors, effects, and rewards are synchronized again, **When** semantic comparison runs, **Then** the previous snapshot is reused.
3. **Given** the reward list changes, **When** synchronization runs again, **Then** the world state reports a changed snapshot.

### User Story 3 - Carry Office Rewards Back to City (Priority: P3)

As the simulation, when the player exits the office after company progression changed, the city receives the resulting progression rewards without adding visible UI.

**Independent Test**: Build an office return payload after progression world effects exist and confirm the city synchronizer receives copied rewards.

**Acceptance Scenarios**:

1. **Given** the office exit creates progression world effects, **When** the player exits to the city, **Then** the return payload carries copied progression rewards.
2. **Given** no progression effects are present, **When** the player exits to the city, **Then** the payload carries no rewards.
3. **Given** the city scene starts from a return payload with rewards, **When** it synchronizes world state, **Then** the latest city snapshot includes those rewards.

### Edge Cases

- No progression effects: no rewards are produced.
- Same-level or regressed progression: no rewards are produced because trigger and effect creation already filter those cases.
- Multi-level jump: rewards preserve effect order so consumers can process rewards predictably.
- Returned reward mutation: copies protect effect source data and synchronizer state.
- Runtime handoff constraints: validation, review, publishing, merge, deployment, GitHub mutation, and primary-repository mutation remain outside this runtime.

## Requirements

### Functional Requirements

- **FR-001**: The system MUST define a copied, in-memory reward record for company progression level-reached effects.
- **FR-002**: The system MUST convert each company progression world effect into exactly one reward without changing effect ordering.
- **FR-003**: A company progression reward MUST include a reward id, reward type, source, effect id, trigger id, previous level, reached level, company stage, layout id, floor count, max employee count, unlocked zones, and reached milestone identifiers.
- **FR-004**: World-state snapshots MUST include a copied reward list in addition to existing world, building, actor, and effect state.
- **FR-005**: World-state semantic comparison MUST treat reward changes as world-state changes while reusing the previous snapshot when rewards are unchanged.
- **FR-006**: Office-to-city return payloads MUST be able to carry copied progression rewards from the office scene to the city scene.
- **FR-007**: The feature MUST NOT add visible UI, persistence, network calls, review automation, publishing, deployment, GitHub mutation, or primary-repository mutation.

### Key Entities

- **Company Progression Reward**: A world-state-visible record of the reward granted by a company progression world effect.
- **World State Snapshot Rewards**: The copied list of current progression rewards stored with the synchronized city snapshot.
- **Office Return Rewards**: The copied reward handoff carried from the office scene back to the city scene.

## Success Criteria

### Measurable Outcomes

- **SC-001**: One progression world effect produces exactly one reward with the reached-level reward context.
- **SC-002**: Three ordered progression world effects produce exactly three ordered rewards.
- **SC-003**: A world-state snapshot synchronized with rewards exposes those rewards without allowing returned-object mutation to affect stored state.
- **SC-004**: Re-synchronizing unchanged rewards reports no semantic change, while synchronizing a different reward list reports a changed snapshot.
- **SC-005**: Office exit can hand company progression rewards back to the city without changing visible controls or dashboard rendering.

## Assumptions

- Rewards are in-memory only and represent the latest office-to-city handoff; durable reward history is follow-up scope.
- Existing company progression world effects remain the source of truth for level-up reward creation.
- The city world-state snapshot is the correct foundation boundary for future reward presentation and reactions.
