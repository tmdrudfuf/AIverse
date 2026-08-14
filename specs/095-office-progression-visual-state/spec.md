# Feature Specification: Office Progression Visual State

**Feature Branch**: `codex/095-office-progression-visual-state`

**Created**: 2026-08-13

**Status**: Draft

**Input**: User description: "Office Progression Visual State"

## Current Product Limitation

Company progression now drives real level, layout, capacity, floor, reward, and event-feed state. City-side panels can show progression outcomes, but the office itself still looks visually static while the player is inside it. Players cannot confirm at a glance which progression level, employee capacity, floor count, or office zones are currently active without opening dashboard text.

## User Scenarios & Testing

### User Story 1 - See Office Progression State In The Office (Priority: P1)

As a player inside the company office, I can see a compact in-scene visual state showing the current company level, stage, employee capacity, floor count, and active zone count.

**Why this priority**: This is the first directly visible office-side confirmation that progression has affected the workspace.

**Independent Test**: Create office progression visual state from a progression snapshot and active layout, then confirm the summary contains the current level, formatted stage, capacity, floors, and active-zone count.

**Acceptance Scenarios**:

1. **Given** a company progression snapshot, **When** the office scene renders, **Then** an in-scene visual state summary displays the current company level and stage.
2. **Given** the snapshot includes employee capacity and floor count, **When** the summary renders, **Then** it displays both values without opening the project portal.
3. **Given** the active layout contains unlocked zones, **When** the summary renders, **Then** it displays the number of active zones represented by the layout.

---

### User Story 2 - Mark Active Office Zones (Priority: P2)

As a player moving through the office, I can see compact zone markers for the active office zones unlocked by current company progression.

**Independent Test**: Generate zone markers from an active layout and confirm unlocked zones are labeled and bounded to avoid covering movement content.

**Acceptance Scenarios**:

1. **Given** the active layout has zone position hints, **When** the office visual state is created, **Then** active zone labels appear at deterministic in-office positions.
2. **Given** more zones are active than the marker budget allows, **When** markers are generated, **Then** only a bounded number of markers is displayed.
3. **Given** a zone exists in the layout but is not unlocked by progression, **When** markers are generated, **Then** that zone is not shown as active.

---

### User Story 3 - Keep Office Visual State Stable And Read-Only (Priority: P3)

As the simulation updates office state repeatedly, the visual state remains a read-only projection of progression data and does not mutate progression snapshots or layout snapshots.

**Independent Test**: Mutate returned visual rows and markers, then regenerate from the same progression/layout inputs and confirm the original snapshots remain unchanged.

**Acceptance Scenarios**:

1. **Given** a visual-state view model is generated, **When** UI code mutates that model, **Then** source progression and layout data remain unchanged.
2. **Given** the project portal overlay is open, **When** office updates continue, **Then** the progression visual state does not intercept portal input or replace existing portal content.
3. **Given** no progression data is available during setup, **When** the visual state updates, **Then** it falls back to hidden or empty markers instead of rendering stale data.

### Edge Cases

- Layout contains more unlocked zones than can fit cleanly: markers are bounded.
- Progression snapshot has no unlocked zones: zone markers are hidden while the summary remains display-safe.
- Long stage or zone labels: labels are formatted into compact display text.
- Existing office title, exit marker, interaction prompt, NPCs, overlays, and portal UI must remain intact.
- Runtime handoff constraints: validation, review, publishing, merge, deployment, GitHub mutation, and primary-repository mutation remain outside this runtime.

## Requirements

### Functional Requirements

- **FR-001**: The office scene MUST render a compact visual state summary derived from the current company progression snapshot.
- **FR-002**: The summary MUST display current company level, formatted company stage, employee capacity, floor count, and active-zone count.
- **FR-003**: The office scene MUST render bounded active-zone markers from the current active office layout and progression unlocked-zone list.
- **FR-004**: Zone markers MUST be positioned from existing office layout position hints and MUST NOT require new tilemap art.
- **FR-005**: Visual-state generation MUST consume progression and layout snapshots without mutating source data.
- **FR-006**: The visual state MUST update from existing office progression data and MUST NOT add persistence, network calls, review automation, publishing, deployment, GitHub mutation, or primary-repository mutation.

### Key Entities

- **Office Progression Visual State**: A read-only in-scene projection of current company progression.
- **Office Progression Summary**: Compact text values for level, stage, capacity, floors, and active-zone count.
- **Active Office Zone Marker**: A bounded label placed from layout position hints for zones unlocked by progression.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A level-2 progression snapshot produces a summary containing level 2, formatted stage, employee capacity, floor count, and active-zone count.
- **SC-002**: A layout with more than six active zones produces no more than six visible zone markers.
- **SC-003**: A layout zone absent from the progression unlocked-zone list produces no active marker.
- **SC-004**: Regenerating visual state after mutating a returned model produces the original labels again.
- **SC-005**: Existing office interaction surfaces remain available because the feature adds only read-only scene objects.

## Assumptions

- The current `CompanyProgressionSnapshot` and `OfficeLayoutSnapshot` are the correct sources of truth for office visual state.
- The first implementation uses Phaser scene objects inside the office scene, not React overlays or new tilemap assets.
- Animation, new floor navigation, redesigned office art, marker dismissal, persistence, and alternate layouts are follow-up scope.
