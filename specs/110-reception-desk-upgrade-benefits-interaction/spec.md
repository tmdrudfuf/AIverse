# Feature Specification: Reception Desk Upgrade Benefits Interaction

**Feature Branch**: `codex/110-reception-desk-upgrade-benefits-interaction`
**Created**: 2026-08-19
**Status**: Draft
**Input**: Feature description: "Reception Desk Upgrade Benefits Interaction"

## User Scenarios & Testing

### User Story 1 - See reception desk upgrade benefits in the workspace (Priority: P1)

As a player who has unlocked the level 2 reception desk, I can open the workspace from the desk and see what the reception upgrade now provides.

**Why this priority**: The desk should communicate the value of the level 2 upgrade, not only open the existing workspace.

**Independent Test**: Put the company at level 2 with reception unlocked, open the workspace, and verify the workspace shows reception desk benefits.

**Acceptance Scenarios**:

1. **Given** the company has reached level 2 and reception is unlocked, **When** the workspace is opened from the reception desk, **Then** the workspace includes a reception upgrade benefits section.
2. **Given** the company has not unlocked reception, **When** the workspace is opened, **Then** reception-specific benefits are not shown.

### User Story 2 - Keep benefit text tied to progression state (Priority: P2)

As progression changes, the benefits shown for the reception desk match the current company level and unlock state.

**Why this priority**: Players need trustworthy feedback about which upgrade benefits are actually available.

**Independent Test**: Compare level 1 and level 2 progression states and verify only the level 2 state produces enabled reception benefits.

**Acceptance Scenarios**:

1. **Given** level 2 progression with reception unlocked, **When** benefits are derived, **Then** the benefit list includes reception, employee capacity, and workspace coordination improvements.
2. **Given** level 1 progression, **When** benefits are derived, **Then** no enabled reception benefit panel is produced.

## Edge Cases

- Repeated workspace renders must not duplicate benefit rows.
- If progression data is unavailable, the workspace remains usable without reception benefit text.
- Benefit display must not imply that activating the desk starts external agent runtimes or mutates repositories.

## Requirements

### Functional Requirements

- **FR-001**: The workspace MUST show reception upgrade benefits only when the current company progression is level 2 or higher and reception is unlocked.
- **FR-002**: The benefit content MUST identify the reception area, increased employee capacity, and improved workspace coordination.
- **FR-003**: The workspace MUST omit reception-specific benefit content before the reception unlock is active.
- **FR-004**: The benefit display MUST be passive information only and MUST NOT start runtimes, validation, review, GitHub operations, or repository mutation.
- **FR-005**: Benefit content MUST be derived from current progression state so stale lower-level state does not show unlocked reception benefits.

### Key Entities

- **Reception Upgrade Benefits**: A passive workspace summary shown after the reception desk unlock is active.
- **Company Progression Snapshot**: Current progression state that determines whether reception benefits are available.

## Success Criteria

- **SC-001**: Level 2 players can identify at least three reception upgrade benefits from the workspace after opening the reception desk.
- **SC-002**: Level 1 players never see reception upgrade benefits in the workspace.
- **SC-003**: The benefit display appears without adding any new external runtime, repository, or GitHub side effects.
- **SC-004**: Workspace rendering remains stable across repeated opens and refreshes.

## Assumptions

- "Upgrade benefits" refers to explaining the level 2 reception unlock value inside the existing workspace surface.
- The reception desk continues to open the existing workspace rather than a new modal or real external runtime.
