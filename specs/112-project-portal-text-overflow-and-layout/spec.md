# Feature Specification: Project Portal Text Overflow and Layout Stability

**Feature Branch**: `112-project-portal-text-overflow-and-layout`

**Created**: 2026-08-19

**Status**: Draft

**Input**: User description: "Project Portal Text Overflow and Layout Stability"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Read Portal Rows Without Overlap (Priority: P1)

As a Founder using the office Project Portal, I need long project names, task titles, repository labels, summaries, and runtime status rows to stay inside their visible panels so I can scan the portal without text covering other information.

**Why this priority**: The Project Portal is the main in-office work surface. Overflowing or overlapping rows make existing project, task, and runtime information hard to trust.

**Independent Test**: Open the Project Portal with long realistic project, repository, task, employee, and runtime labels and verify every visible row is clipped, wrapped, or omitted within its panel without covering the instruction row.

**Acceptance Scenarios**:

1. **Given** the Project Portal contains long project dashboard rows, **When** the Founder opens the dashboard view, **Then** visible rows remain inside their panels and do not overlap each other.
2. **Given** long titles or labels appear in project detail, task detail, candidate detail, repository detail, or workspace views, **When** the Founder navigates to those views, **Then** the text is shortened or wrapped within the available portal area.

---

### User Story 2 - Preserve Portal Navigation Cues (Priority: P2)

As a Founder navigating the portal with the keyboard, I need footer instructions and selection rows to remain visible and separate from content so I can understand the available action without layout ambiguity.

**Why this priority**: The portal is keyboard driven, and action prompts become unreliable when body text collides with footer controls.

**Independent Test**: Navigate between list, detail, workspace, repository, task, employee, project dashboard, and candidate detail views with long content and confirm footer instructions stay readable.

**Acceptance Scenarios**:

1. **Given** a portal view contains more text than the available space, **When** the Founder reaches the bottom of the content area, **Then** footer instructions remain clear of content.
2. **Given** a selected row has a highlighted background, **When** the row text is long, **Then** the highlight does not cause the row to collide with neighboring rows.

### Edge Cases

- Long unbroken words, branch names, repository identifiers, or generated reason codes should be compacted instead of expanding outside the panel.
- Multi-line summaries should be clamped when they would push lower content into the footer.
- Optional low-priority dashboard rows should be dropped before core status, activity, advisory, and action cues overlap.
- Empty or unavailable portal data should continue to render the existing fallback messages.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Project Portal MUST constrain visible text within each portal panel's available width and height.
- **FR-002**: The Project Portal MUST prevent body rows from overlapping footer instruction text in all existing portal view modes.
- **FR-003**: The Project Dashboard lower panel MUST keep core status rows visible before lower-priority optional rows when space is limited.
- **FR-004**: Long single-line identifiers MUST be compacted with a clear truncation indicator rather than spilling horizontally.
- **FR-005**: Multi-line content MUST be clamped where needed so neighboring rows keep a readable gap.
- **FR-006**: Existing Project Portal navigation behavior and read-only/mutation boundaries MUST remain unchanged.
- **FR-007**: Focused automated coverage MUST exercise representative long-content layouts.

### Key Entities

- **Portal Text Row**: A visible text item inside the Project Portal, including title, status, detail, list, and instruction rows.
- **Portal Panel**: A bounded area that groups related portal rows.
- **Overflow Policy**: The visible result when text exceeds available width or height: wrap, clamp, compact, or drop.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Representative long-content portal fixtures render with zero detected row-to-row overlaps in covered views.
- **SC-002**: Footer instructions remain visually separated from content by at least one row gap in covered views.
- **SC-003**: Long single-line identifiers display a truncation indicator in 100% of covered overflow cases.
- **SC-004**: Existing empty/unavailable portal fallback scenarios remain readable and unchanged in intent.

## Assumptions

- The portal remains a compact in-game overlay rather than becoming a scrollable external UI.
- The feature uses existing Project Portal data and does not add new project, repository, task, employee, runtime, GitHub, or persistence behavior.
- Focused unit-style rendering tests are sufficient for this implementation runtime because browser/dev-server validation is prohibited by handoff policy.
