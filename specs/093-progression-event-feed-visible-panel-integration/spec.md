# Feature Specification: Progression Event Feed Visible Panel Integration

**Feature Branch**: `codex/093-progression-event-feed-visible-panel-integration`

**Created**: 2026-08-12

**Status**: Draft

**Input**: User description: "Progression Event Feed Visible Panel Integration"

## Current Product Limitation

Progression feed events are now present in city world-state snapshots after office-to-city handoff. Players still cannot see those progression events in the city, so earned company-level changes are only available to internal consumers.

## User Scenarios & Testing

### User Story 1 - See Latest Progression Events In City (Priority: P1)

As a player returning to the city after company progression changes, I can see a compact city panel summarizing the latest progression events.

**Why this priority**: The panel is the first visible consumer of the progression event feed and confirms the office-to-city feed path without adding persistence.

**Independent Test**: Render a city feed snapshot with one progression event and confirm the panel displays the level reached, stage, unlocked zones, and milestone count.

**Acceptance Scenarios**:

1. **Given** the city world-state snapshot contains progression feed events, **When** the city scene synchronizes, **Then** a fixed visible panel displays the latest events.
2. **Given** a progression event includes unlocked zones, **When** the panel renders it, **Then** the event row names those zones without overflowing the compact row budget.
3. **Given** a progression event includes milestones, **When** the panel renders it, **Then** the event row summarizes the milestone count.

### User Story 2 - Hide Empty Feed State (Priority: P2)

As a player in the city with no progression feed events, I should not see an empty or placeholder event-feed panel.

**Independent Test**: Render a city feed snapshot with no progression events and confirm the panel is hidden.

**Acceptance Scenarios**:

1. **Given** the city world-state snapshot has no feed events, **When** the city scene synchronizes, **Then** no progression feed panel is visible.
2. **Given** a previously visible feed is replaced by an empty feed, **When** the panel updates, **Then** the previous rows are cleared.

### User Story 3 - Keep Panel Current Without Mutating State (Priority: P3)

As the city scene, when world-state synchronization runs repeatedly, the visible feed panel stays aligned to the copied snapshot data without mutating world-state feed records.

**Independent Test**: Format multiple copied feed events and confirm newest rows are bounded, ordered, and independent from source mutation.

**Acceptance Scenarios**:

1. **Given** multiple progression feed events, **When** the panel updates, **Then** it displays the most recent bounded set in feed order.
2. **Given** a returned display row is mutated by UI code, **When** rows are generated again from the same feed snapshot, **Then** the source feed events remain unchanged.
3. **Given** synchronization runs without semantic feed changes, **When** the panel updates, **Then** the visible rows remain stable.

### Edge Cases

- No feed events: no visible panel is shown.
- More events than the panel can show: only the latest bounded set is displayed.
- Long unlocked-zone lists: rows are summarized to fit the compact city HUD.
- Runtime handoff constraints: validation, review, publishing, merge, deployment, GitHub mutation, and primary-repository mutation remain outside this runtime.

## Requirements

### Functional Requirements

- **FR-001**: The city scene MUST render a fixed visible progression event feed panel when the synchronized world-state snapshot contains feed events.
- **FR-002**: The panel MUST display progression level reached, company stage, unlocked-zone summary, and milestone-count summary for each visible event.
- **FR-003**: The panel MUST hide itself when no feed events are present.
- **FR-004**: The panel MUST display a bounded number of recent feed events to avoid covering city navigation content.
- **FR-005**: The panel MUST consume copied world-state feed events without mutating source snapshot records.
- **FR-006**: The feature MUST NOT add persistence, network calls, review automation, publishing, deployment, GitHub mutation, or primary-repository mutation.

### Key Entities

- **Visible Progression Feed Panel**: A fixed city HUD panel that renders latest progression feed event summaries.
- **Feed Panel Row**: A display-safe summary derived from one progression feed event.
- **World-State Feed Snapshot**: The copied event list already exposed by city world-state synchronization.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A snapshot with one progression feed event produces one visible row containing level, stage, unlocked-zone, and milestone information.
- **SC-002**: A snapshot with no feed events produces no visible progression feed panel.
- **SC-003**: A snapshot with more than three feed events displays no more than three rows.
- **SC-004**: Feed row text remains within a compact HUD row budget for long zone and milestone data.
- **SC-005**: Repeated synchronization keeps displayed rows stable when feed events are unchanged.

## Assumptions

- The visible panel is an in-scene Phaser HUD, because the feed data currently lives in city scene world-state synchronization.
- Durable event history, dismissal, animation, filters, and notification timing are follow-up scope.
- The existing in-memory event feed remains the source for this visible integration.
