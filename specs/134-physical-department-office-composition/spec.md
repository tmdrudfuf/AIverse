# Feature Specification: Physical Department Office Composition

**Feature Branch**: `codex/134-physical-department-office-composition`

**Created**: 2026-08-28

**Status**: Draft

**Input**: User description: "Physical Department Office Composition"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Read Future Department Areas (Priority: P1)

An operator or office system can read the physical department areas planned for a growing company office so future visuals and workflows can distinguish teams by space.

**Why this priority**: The office already has future layout metadata, but department areas are only implied by generic zones.

**Independent Test**: Request the growing company layout and verify department areas are exposed in a stable order with floor, zone, and position hints.

**Acceptance Scenarios**:

1. **Given** the company reaches the growing-company office stage, **When** layout metadata is read, **Then** frontend engineering, backend engineering, design, and QA department areas are present.
2. **Given** department areas are read, **When** callers inspect their physical composition, **Then** each area identifies its floor, zone, position, workstation slots, and meeting slots.

### User Story 2 - Preserve Current Office Behavior (Priority: P2)

The current Daily Proof garage office continues to use its existing layout without unlocked department areas.

**Why this priority**: Department metadata is future composition data and must not change the active Level 1 office workflow.

**Independent Test**: Request the active layout and verify department areas are empty while zones, slots, and entry points remain unchanged.

### User Story 3 - Protect Layout Definitions (Priority: P3)

Callers cannot mutate configured department definitions through returned layout snapshots.

**Why this priority**: Existing layout APIs return defensive copies; department composition must preserve that contract.

**Independent Test**: Mutate returned department data and verify a fresh layout read returns the configured values.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST support optional physical department areas on office layout snapshots.
- **FR-002**: Department areas MUST include a stable id, department kind, label, floor id, zone id, position hint, unlocked state, workstation slot ids, and meeting slot ids.
- **FR-003**: The growing company future layout MUST define frontend engineering, backend engineering, design, and QA department areas.
- **FR-004**: Active Level 1 office layout reads MUST remain valid and MUST NOT expose unlocked department areas.
- **FR-005**: Layout reads MUST defensively copy department areas and their nested arrays/position hints.

### Key Entities

- **Physical Department Area**: A spatial department composition record inside an office floor, tied to layout zones and slot ids.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Focused tests can verify four future department areas for the growing company layout.
- **SC-002**: Focused tests can verify active Level 1 layout behavior is unchanged.
- **SC-003**: Focused tests can verify department area defensive reads.

## Assumptions

- This feature only adds deterministic layout metadata and accessors.
- Rendering, persistence, employee routing, ADOS state, and project workflows are out of scope.
