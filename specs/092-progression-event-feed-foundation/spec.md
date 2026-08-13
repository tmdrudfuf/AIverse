# Feature Specification: Progression Event Feed Foundation

**Feature Branch**: `codex/092-progression-event-feed-foundation`

**Created**: 2026-08-12

**Status**: Draft

**Input**: User description: "Progression Event Feed Foundation"

## Current Product Limitation

Company progression can now produce triggers, world effects, and reward records that move from the office back into the city world-state snapshot. The system still lacks a stable event-feed record that future city notifications, timelines, audit views, and visible feed UI can consume without reinterpreting reward internals.

## User Scenarios & Testing

### User Story 1 - Represent Progression Feed Events (Priority: P1)

As a future event-feed consumer, when a company progression reward is granted, I can read a copied feed event that summarizes the level reached and reward context.

**Why this priority**: Feed entries are the foundation future notifications, timelines, and visible event presentation need before any UI or persistence is added.

**Independent Test**: Convert one progression reward into one feed event and confirm the event includes copied level, stage, capacity, unlocked-zone, milestone, and source reward context.

**Acceptance Scenarios**:

1. **Given** a company progression reward, **When** feed events are created, **Then** one `company_progression_feed_event` record is produced with the source reward id and reached-level context.
2. **Given** multiple progression rewards, **When** feed events are created, **Then** one feed event is produced per reward in the same order.
3. **Given** a consumer mutates a returned feed event, **When** feed events are requested again, **Then** source reward data and previously stored event data remain unchanged.

### User Story 2 - Include Feed Events in City World State (Priority: P2)

As the city scene, when synchronizing world state, I can include latest progression feed events alongside buildings, actors, effects, and rewards.

**Independent Test**: Synchronize a city world-state snapshot with feed events and confirm the snapshot contains copied feed events and treats changed feed events as semantic world-state changes.

**Acceptance Scenarios**:

1. **Given** progression feed events are supplied during synchronization, **When** the world-state snapshot is created, **Then** the snapshot includes those feed events.
2. **Given** identical buildings, actors, effects, rewards, and feed events are synchronized again, **When** semantic comparison runs, **Then** the previous snapshot is reused.
3. **Given** the feed event list changes, **When** synchronization runs again, **Then** the world state reports a changed snapshot.

### User Story 3 - Carry Office Feed Events Back to City (Priority: P3)

As the simulation, when the player exits the office after company progression changed, the city receives progression feed events without adding visible UI.

**Independent Test**: Build an office return payload after progression rewards exist and confirm the city synchronizer receives copied feed events.

**Acceptance Scenarios**:

1. **Given** the office exit creates progression rewards, **When** the player exits to the city, **Then** the return payload carries copied progression feed events.
2. **Given** no progression rewards are present, **When** the player exits to the city, **Then** the payload carries no feed events.
3. **Given** the city scene starts from a return payload with feed events, **When** it synchronizes world state, **Then** the latest city snapshot includes those feed events.

### Edge Cases

- No progression rewards: no feed events are produced.
- Multi-level jump: feed events preserve reward order so consumers can present them predictably.
- Returned feed event mutation: copies protect reward source data and synchronizer state.
- Runtime handoff constraints: validation, review, publishing, merge, deployment, GitHub mutation, and primary-repository mutation remain outside this runtime.

## Requirements

### Functional Requirements

- **FR-001**: The system MUST define a copied, in-memory feed event record for company progression rewards.
- **FR-002**: The system MUST convert each company progression reward into exactly one feed event without changing reward ordering.
- **FR-003**: A progression feed event MUST include an event id, event type, source, reward id, effect id, trigger id, previous level, reached level, company stage, layout id, floor count, max employee count, unlocked zones, and reached milestone identifiers.
- **FR-004**: World-state snapshots MUST include a copied feed event list in addition to existing world, building, actor, effect, and reward state.
- **FR-005**: World-state semantic comparison MUST treat feed event changes as world-state changes while reusing the previous snapshot when feed events are unchanged.
- **FR-006**: Office-to-city return payloads MUST be able to carry copied progression feed events from the office scene to the city scene.
- **FR-007**: The feature MUST NOT add visible UI, persistence, network calls, review automation, publishing, deployment, GitHub mutation, or primary-repository mutation.

### Key Entities

- **Progression Feed Event**: A world-state-visible event-feed record derived from a company progression reward.
- **World State Snapshot Feed Events**: The copied list of current progression feed events stored with the synchronized city snapshot.
- **Office Return Feed Events**: The copied feed event handoff carried from the office scene back to the city scene.

## Success Criteria

### Measurable Outcomes

- **SC-001**: One progression reward produces exactly one feed event with the reached-level reward context.
- **SC-002**: Three ordered progression rewards produce exactly three ordered feed events.
- **SC-003**: A world-state snapshot synchronized with feed events exposes those events without allowing returned-object mutation to affect stored state.
- **SC-004**: Re-synchronizing unchanged feed events reports no semantic change, while synchronizing a different feed event list reports a changed snapshot.
- **SC-005**: Office exit can hand progression feed events back to the city without changing visible controls or dashboard rendering.

## Assumptions

- Feed events are in-memory only and represent the latest office-to-city handoff; durable event history is follow-up scope.
- Existing company progression rewards remain the source of truth for feed event creation.
- The city world-state snapshot is the correct foundation boundary for future feed presentation and notifications.
