# Feature Specification: Company Growth Gameplay Loop Integration

**Feature Branch**: `codex/096-company-growth-gameplay-loop-integration`

**Created**: 2026-08-13

**Status**: Draft

**Input**: User description: "Company Growth Gameplay Loop Integration"

## Current Product Limitation

Company progression can already calculate levels, office layouts, visual office state, world effects, rewards, and event feed entries. These pieces are still connected at the scene boundary through repeated ad hoc calls. Players need the growth loop to behave as one coherent gameplay outcome: when company progress reaches a new level, the same trigger should drive the world effect, reward payload, event feed, and city return handoff.

## User Scenarios & Testing

### User Story 1 - Produce One Growth Loop Result (Priority: P1)

As a player whose company reaches a new level, I get one consistent growth loop result that includes the level trigger, world effect, reward, and feed event for that level.

**Independent Test**: Create a level-up trigger, run the growth loop service, and confirm the result contains copied triggers, effects, rewards, and event feed entries with matching trigger/effect/reward IDs.

**Acceptance Scenarios**:

1. **Given** one or more company progression triggers, **When** the growth loop is evaluated, **Then** matching world effects, rewards, and feed events are produced in trigger order.
2. **Given** no level-up triggers, **When** the growth loop is evaluated, **Then** all loop result arrays are empty.
3. **Given** caller code mutates a returned loop result, **When** the same input is evaluated again, **Then** source triggers and generated outputs remain unchanged.

---

### User Story 2 - Use Growth Loop Result At Office Exit (Priority: P2)

As a player returning from the office to the city, the city receives the exact growth loop outputs produced for the current company progression change.

**Independent Test**: Ask the portal controller for a growth loop result after progression triggers are stored, mutate the returned result, and confirm later access still returns copied payloads.

**Acceptance Scenarios**:

1. **Given** the portal controller has recorded company progression triggers, **When** the office scene creates the city return payload, **Then** it passes the loop result effects, rewards, and feed events to the exit controller.
2. **Given** no current progression triggers are recorded, **When** the office scene creates the city return payload, **Then** the payload omits growth effect, reward, and feed arrays.
3. **Given** the portal overlay is open or office visual state refreshes, **When** the loop result is requested, **Then** the request does not mutate dashboard, progression, layout, or visual state.

### Edge Cases

- Multiple level jumps must keep generated effects, rewards, and feed entries in ascending level order.
- Empty trigger lists must return an empty, display-safe result.
- Existing office exit behavior, project portal interactions, office visual state, city panels, validation runtime, review runtime, GitHub mutation, publishing, deployment, and primary-repository mutation remain out of scope.

## Requirements

### Functional Requirements

- **FR-001**: The system MUST expose a reusable company growth gameplay loop result from current progression triggers.
- **FR-002**: The loop result MUST include copied triggers, world effects, rewards, and event feed entries derived from the same trigger set.
- **FR-003**: Generated world effects MUST feed reward generation, and generated rewards MUST feed event-feed generation.
- **FR-004**: Office exit handoff MUST consume the loop result rather than recreating the effect/reward/feed chain inline.
- **FR-005**: The loop result MUST be immutable from the caller's perspective by returning fresh copies on each evaluation/access.
- **FR-006**: The feature MUST NOT add persistence, network calls, runtime execution, validation execution, review automation, publishing, deployment, GitHub mutation, or primary-repository mutation.

### Key Entities

- **Company Growth Gameplay Loop Result**: The copied trigger/effect/reward/feed bundle for the current progression change.
- **Progression Trigger**: Existing company level-up signal created by the portal controller.
- **World Effect, Reward, Feed Event**: Existing world-state outputs derived in sequence from progression triggers.

## Success Criteria

### Measurable Outcomes

- **SC-001**: One level-2 trigger produces exactly one world effect, one reward, and one feed event with matching lineage IDs.
- **SC-002**: Two level-up triggers produce two effects, two rewards, and two feed events in ascending target-level order.
- **SC-003**: Empty trigger input produces a loop result with four empty arrays.
- **SC-004**: Mutating a returned loop result does not mutate later loop results or source triggers.
- **SC-005**: The office scene no longer contains inline construction of progression world effects, rewards, and feed events.

## Assumptions

- `OfficeProjectPortalController` remains the source of current progression triggers.
- Existing `CompanyProgressionWorldEffectService`, `CompanyProgressionRewardService`, and `CompanyProgressionEventFeedService` remain the authoritative generation steps.
- The first integration is a pure TypeScript service plus office scene/controller wiring; broader persistence or history handling is follow-up scope.
