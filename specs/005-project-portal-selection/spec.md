# Feature Specification: Project Portal Selection

**Feature Branch**: `005-project-portal-selection`

**Created**: 2026-06-27

**Status**: Draft

**Input**: User description: "Implement Phase 11: Project Portal Selection."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Navigate Project List (Priority: P1)

As the Founder using the office computer, I need to move selection through the portal projects with the keyboard so I can choose which project to inspect.

**Why this priority**: The portal currently displays static rows only; selection is the next required step toward a useful project dashboard.

**Independent Test**: Open the portal, verify Daily Proof is selected, press Down and Up, and confirm the selected row changes predictably.

**Acceptance Scenarios**:

1. **Given** the portal is open in list view, **When** Down is pressed, **Then** the next project row is selected.
2. **Given** the portal is open in list view, **When** Up is pressed, **Then** the previous project row is selected.

---

### User Story 2 - Open Project Detail (Priority: P2)

As the Founder, I need Enter or Space on a selected project to open a simple detail view so I can inspect placeholder project information.

**Why this priority**: Project detail is the first portal drill-down surface and must remain placeholder-only for future integrations.

**Independent Test**: Select Daily Proof, press Enter or Space, and verify the detail view opens with name, status, type, description, linked services, and next action.

**Acceptance Scenarios**:

1. **Given** Daily Proof is selected, **When** Enter is pressed, **Then** Daily Proof detail appears.
2. **Given** Portfolio or AI Lab is selected, **When** Enter or Space is pressed, **Then** a coming-soon detail view appears.

---

### User Story 3 - Back And Placeholder Action (Priority: P3)

As the Founder, I need Esc from detail to return to the list and Enter or Space in detail to trigger only a placeholder action.

**Why this priority**: Back/action behavior establishes input semantics without adding real project workspaces or integrations.

**Independent Test**: Open a project detail, press Esc to return to list, then open detail again and press Enter/Space to confirm a placeholder action is recorded or logged.

**Acceptance Scenarios**:

1. **Given** project detail is open, **When** Esc is pressed, **Then** the portal returns to list view.
2. **Given** project detail is open, **When** Enter or Space is pressed, **Then** a placeholder action is produced and no real workspace opens.
3. **Given** list view is open, **When** Esc is pressed, **Then** the portal closes.

### Edge Cases

- Disabled or coming-soon projects remain selectable and show detail, but next action remains disabled/placeholder-only.
- Same-frame Space open bugs must remain prevented.
- Movement, zoom, exit, and object interactions remain blocked while portal is open.
- No real GitHub, Firebase, API, NPC, simulation, React overlay, or complex dashboard behavior is added.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Portal MUST support list and detail view modes.
- **FR-002**: Portal MUST default to list view with Daily Proof selected.
- **FR-003**: Up and Down MUST change selected project in list view using deterministic clamped movement.
- **FR-004**: Enter or Space in list view MUST open selected project detail.
- **FR-005**: Esc in detail view MUST return to list view.
- **FR-006**: Esc in list view MUST close the portal.
- **FR-007**: Enter or Space in detail view MUST trigger a placeholder next action only.
- **FR-008**: Detail view MUST show project name, status, type, description, linked services, and next action.
- **FR-009**: Portal MUST own Up, Down, Enter, Space, and Esc while open.
- **FR-010**: Existing blocked movement/zoom/exit/object behavior while portal is open MUST remain intact.

### Key Entities

- **Project Portal View Mode**: Current portal display state, either list or detail.
- **Selected Project**: The project row currently selected in list view or shown in detail view.
- **Placeholder Project Action**: A non-integrated detail action result.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A player can change selected project with Up/Down in list view.
- **SC-002**: A player can open detail for each initial project with Enter or Space.
- **SC-003**: A player can return from detail to list with Esc and close from list with Esc.
- **SC-004**: Detail Enter/Space produces only a placeholder action.
- **SC-005**: Type checking, production build, and whitespace validation complete successfully.

## Assumptions

- Selection clamps at the first and last project instead of wrapping.
- Disabled projects are inspectable but their next action is disabled/placeholder-only.
- Phaser overlay remains the correct UI surface for Phase 11.