# Feature Specification: Progression Reward Presentation

**Feature Branch**: `codex/094-progression-reward-presentation`

**Created**: 2026-08-13

**Status**: Draft

**Input**: User description: "Progression Reward Presentation"

## Current Product Limitation

Company progression rewards are copied into city world-state snapshots after office-to-city handoff, and progression feed events can already be shown in a compact city panel. Players still cannot see the concrete reward benefits granted by progression, such as capacity increases, layout growth, and unlocked office zones.

## User Scenarios & Testing

### User Story 1 - See Latest Progression Rewards In City (Priority: P1)

As a player returning to the city after company progression grants rewards, I can see a compact reward presentation summarizing the latest benefits.

**Why this priority**: The reward presentation is the first visible consumer of copied progression reward records and confirms the reward path without adding persistence.

**Independent Test**: Render a city world-state snapshot with one progression reward and confirm the presentation displays reached level, stage, employee capacity, floor count, and unlocked-zone context.

**Acceptance Scenarios**:

1. **Given** the city world-state snapshot contains progression rewards, **When** the city scene synchronizes, **Then** a fixed visible reward presentation displays the latest rewards.
2. **Given** a reward includes unlocked zones, **When** the presentation renders it, **Then** the reward row names those zones without overflowing the compact row budget.
3. **Given** a reward includes capacity and floor changes, **When** the presentation renders it, **Then** the reward row summarizes those benefits.

### User Story 2 - Hide Empty Reward State (Priority: P2)

As a player in the city with no progression rewards, I should not see an empty or placeholder reward presentation.

**Independent Test**: Render a city world-state snapshot with no progression rewards and confirm the reward presentation is hidden.

**Acceptance Scenarios**:

1. **Given** the city world-state snapshot has no rewards, **When** the city scene synchronizes, **Then** no progression reward presentation is visible.
2. **Given** a previously visible reward presentation is replaced by an empty reward list, **When** the presentation updates, **Then** the previous rows are cleared.

### User Story 3 - Keep Reward Rows Bounded And Immutable (Priority: P3)

As the city scene, when world-state synchronization runs repeatedly, reward presentation rows stay aligned to copied snapshot rewards without mutating source reward records.

**Independent Test**: Format multiple copied rewards and confirm newest rows are bounded, ordered, display-safe, and independent from source mutation.

**Acceptance Scenarios**:

1. **Given** multiple progression rewards, **When** the presentation updates, **Then** it displays the most recent bounded set in reward order.
2. **Given** a returned display row is mutated by UI code, **When** rows are generated again from the same reward snapshot, **Then** the source reward records remain unchanged.
3. **Given** synchronization runs without semantic reward changes, **When** the presentation updates, **Then** the visible rows remain stable.

### Edge Cases

- No rewards: no visible reward presentation is shown.
- More rewards than the presentation can show: only the latest bounded set is displayed.
- Long unlocked-zone lists: rows are summarized to fit the compact city HUD.
- Existing progression event feed panel: reward presentation must not visually replace or overlap the feed panel.
- Runtime handoff constraints: validation, review, publishing, merge, deployment, GitHub mutation, and primary-repository mutation remain outside this runtime.

## Requirements

### Functional Requirements

- **FR-001**: The city scene MUST render a fixed visible progression reward presentation when the synchronized world-state snapshot contains rewards.
- **FR-002**: The presentation MUST display reached company level, company stage, employee capacity, floor count, and unlocked-zone summary for each visible reward.
- **FR-003**: The presentation MUST hide itself when no progression rewards are present.
- **FR-004**: The presentation MUST display a bounded number of recent rewards to avoid covering city navigation content or the existing progression feed panel.
- **FR-005**: The presentation MUST consume copied world-state reward records without mutating source snapshot records.
- **FR-006**: The feature MUST NOT add persistence, network calls, review automation, publishing, deployment, GitHub mutation, or primary-repository mutation.

### Key Entities

- **Visible Progression Reward Presentation**: A fixed city HUD panel that renders latest progression reward summaries.
- **Reward Presentation Row**: A display-safe summary derived from one progression reward.
- **World-State Reward Snapshot**: The copied reward list already exposed by city world-state synchronization.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A snapshot with one progression reward produces one visible row containing level, stage, capacity, floor, and unlocked-zone information.
- **SC-002**: A snapshot with no rewards produces no visible progression reward presentation.
- **SC-003**: A snapshot with more than three rewards displays no more than three rows.
- **SC-004**: Reward row text remains within a compact HUD row budget for long zone data.
- **SC-005**: Repeated synchronization keeps displayed rows stable when rewards are unchanged.

## Assumptions

- The visible reward presentation is an in-scene Phaser HUD, because rewards currently live in city scene world-state synchronization.
- Durable reward history, dismissal, animation, filters, and reward notification timing are follow-up scope.
- The existing in-memory reward list remains the source for this visible integration.
