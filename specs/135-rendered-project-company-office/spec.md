# Feature Specification: Rendered Project Company Office

**Feature Branch**: `codex/135-rendered-project-company-office`

**Created**: 2026-08-28

**Status**: Draft

**Input**: User description: "Replace the visible project-company office with a newly rendered top-down pixel-art autonomous software-company office aligned with the authoritative Spec 135 requirements and visual reference."

## User Scenarios & Testing

### User Story 1 - Enter a Rendered Software Company Office (Priority: P1)

An operator enters a project company office and immediately sees a dense, top-down pixel-art software-company workplace rather than the old debug-like zone layout.

**Why this priority**: The feature is primarily visual rendering; if the office is not visibly replaced, the feature has no user value.

**Independent Test**: Start the application, enter a project company office, and verify the old founder-desk/employee-desk composition is gone and the office reads as a small autonomous AI software company.

**Acceptance Scenarios**:

1. **Given** the operator is in the city, **When** they enter a project company office, **Then** the visible office composition is substantially replaced by a dense top-down workplace with walls, corridors, workstations, shared areas, and employees.
2. **Given** department labels are visually ignored, **When** the operator inspects the office, **Then** Engineering, Review, Validation/QA, and Project Status/Operations remain distinguishable by their physical furniture and equipment.

---

### User Story 2 - See Physical Departments and Workplaces (Priority: P2)

An operator can recognize the major functional departments and see AI employees placed at meaningful workstation destinations.

**Why this priority**: The office must communicate autonomous software-company activity through physical department layout, not metadata or labels.

**Independent Test**: Inspect the rendered office and confirm the required departments each contain appropriate desks, screens, boards, equipment, and workplace locations.

**Acceptance Scenarios**:

1. **Given** the rendered office is visible, **When** the operator views Engineering, **Then** it contains multiple developer desks, multiple monitors, chairs, planning surface, shelves or equipment, and multiple employee locations.
2. **Given** the rendered office is visible, **When** the operator views Review, **Then** it is physically separate from Engineering and includes a reviewer workstation, display or board, and reviewer location.
3. **Given** the rendered office is visible, **When** the operator views Validation/QA, **Then** it includes dedicated test workstations, test screens, and validation equipment.
4. **Given** the rendered office is visible, **When** the operator views Project Status/Operations, **Then** it includes a large status display, planning board, operations workstation, and planning furniture.

---

### User Story 3 - Preserve Existing Office Behaviors (Priority: P3)

An operator can still use existing project-office interactions after the visual replacement.

**Why this priority**: Visual replacement must not regress project entry, portal interaction, employee infrastructure, ADOS surfaces, or operator navigation.

**Independent Test**: Enter the rendered office, click or activate the project computer/workspace, open the project portal, pan/zoom/navigate, and exit back to the city.

**Acceptance Scenarios**:

1. **Given** the rendered office is active, **When** the operator clicks the project computer/workspace interaction, **Then** the project portal still opens without requiring Founder proximity.
2. **Given** the rendered office is active, **When** employee/NPC snapshots are shown, **Then** employees appear at meaningful physical workplace, review, validation, operations, or shared positions.
3. **Given** a project identity other than the current example company, **When** its office is rendered, **Then** signage uses the project context rather than hard-coded Daily Proof-specific text.

### Edge Cases

- The office should remain understandable if optional department text labels are hidden.
- Existing tilemap collision and exit behavior must remain valid after replacing the visible composition.
- Runtime visual verification is required because generic canvas boot smoke tests do not prove this feature.
- Live ADOS-stage-to-employee movement is explicitly out of scope for this feature.

## Requirements

### Functional Requirements

- **FR-001**: The system MUST replace the old visible office composition rather than drawing the new office on top of the legacy founder-desk/employee-desk/debug-zone presentation.
- **FR-002**: The rendered office MUST use a top-down pixel-art visual style with readable furniture density, walls, partitions, corridors, shared space, reception, lounge/common space, plants, shelving/storage, and lighting/decor.
- **FR-003**: Engineering MUST be physically rendered with multiple developer workstations, multiple monitors/computers, chairs, development screens, planning surface, shelves or equipment, and multiple employee workstation locations.
- **FR-004**: Review MUST be physically rendered as a dedicated area separate from Engineering with reviewer workstation, display or board, chair, and reviewer NPC position.
- **FR-005**: Validation/QA MUST be physically rendered as a dedicated testing workspace with test desks, test screens/computers, testing equipment or visual indicators, and validation workstation positions.
- **FR-006**: Project Status/Operations MUST be physically rendered with a large status display, project/spec board, pipeline/progress visualization surface, planning table or desk, operations workstation, and meeting/planning furniture.
- **FR-007**: Department labels MAY appear but MUST be secondary to physical composition.
- **FR-008**: The visual hierarchy MUST NOT be founder-desk centered, and a Founder Desk MUST NOT be visually dominant.
- **FR-009**: The employee/NPC infrastructure MUST remain active and provide meaningful destinations including engineering workstations, review workstation, validation workstations, operations workstation, and shared/lounge positions.
- **FR-010**: Project portal, project computer/workspace interaction, project/company entry, persistence, ADOS workflow surfaces, trusted local execution status, office exit, city navigation, mouse camera pan, wheel zoom, click interactions, and operator-driven navigation MUST continue to work.
- **FR-011**: Founder proximity MUST NOT be required for clicked project workspace interaction.
- **FR-012**: Project identity and signage MUST derive from project/company context and MUST NOT be hard-coded to the current example company.
- **FR-013**: Runtime visual verification MUST include starting the app, loading the city, entering the active project/company, capturing the actual office screenshot, and comparing it to the requirements and visual reference where tooling permits.
- **FR-014**: Automated tests MUST cover stable rendering/semantic contracts without relying on brittle exact-pixel snapshots.

### Key Entities

- **Rendered Office Composition**: The visible top-down physical office made of walls, floors, departments, furniture, signage, and shared spaces.
- **Rendered Department**: A physical office area for Engineering, Review, Validation/QA, or Project Status/Operations, identifiable by furnishings and equipment.
- **Workplace Destination**: A meaningful NPC position mapped to a visible physical workstation or shared location.
- **Project Identity Signage**: Dynamic text surfaces that display the current project/company identity.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A reviewer can identify all four required departments from physical furniture and equipment without relying primarily on department labels.
- **SC-002**: Engineering visibly contains at least four developer workstation locations.
- **SC-003**: Review, Validation/QA, and Project Status/Operations each visibly contain at least one dedicated workstation or planning surface.
- **SC-004**: The rendered office is visibly denser than the previous mostly-empty floor layout and no large Founder Desk or Employee Desk zone dominates the first view.
- **SC-005**: Existing project workspace interaction still opens the portal by click without Founder proximity.
- **SC-006**: Runtime visual evidence is captured from the actual project office before review.

## Assumptions

- The official visual reference guides composition, density, and direction but is not a pixel-perfect asset requirement.
- Existing Phaser runtime rendering, tilemap boot, collisions, and controller architecture remain the implementation foundation.
- Complete live ADOS-stage employee movement/activity binding is deferred to Spec 136.
