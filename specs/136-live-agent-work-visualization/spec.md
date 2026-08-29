# Feature Specification: Live Agent Work Visualization

**Feature Branch**: `codex/136-live-agent-work-visualization`

**Created**: 2026-08-29

**Status**: Draft

**Input**: User description: "Connect real ADOS project execution state to the Spec 135 rendered project-company office so employee activity, semantic department locations, labels, and Project Status reflect real persisted ADOS/project run state instead of fake workflow animation."

## User Scenarios & Testing

### User Story 1 - See Active Work In The Correct Department (Priority: P1)

As an operator entering a project-company office, I need employees to visibly move to and report the real current ADOS stage so I can tell whether implementation, validation, review, publication, blocked, complete, or idle work is happening.

**Why this priority**: The primary value is truthful work visualization derived from real run state, not simulated animation.

**Independent Test**: Load representative persisted project run states and verify each semantic stage places the relevant employee role in the correct department with a truthful readable label.

**Acceptance Scenarios**:

1. **Given** the selected project has an active implementation or implementation-fix run state, **When** the operator enters or refreshes the office, **Then** an implementer/engineering employee appears at an Engineering workstation with an Implementing or Working status.
2. **Given** validation is running for the selected project, **When** the office renders, **Then** a QA/validation employee appears in the Validation / QA area with a Validating or Testing status.
3. **Given** independent review is active for the selected project, **When** the office renders, **Then** a reviewer employee appears in the Review area with a Reviewing status.
4. **Given** publication, pull request, merge, cleanup, or related approved-candidate stages are active, **When** the office renders, **Then** Project Status / Operations visibly represents Publishing or Operations progress without fabricated percentages.

---

### User Story 2 - Avoid Stale Or Misleading Work State (Priority: P2)

As an operator switching projects or watching a run finish, I need completed, blocked, idle, and project-specific states to remain accurate so the office never implies the wrong work is still happening.

**Why this priority**: State correctness is more important than visual flourish, and stale active status would make the office untrustworthy.

**Independent Test**: Change persisted run state between projects and terminal states, then verify active labels clear, blocked states are distinct, and no previous project state leaks into the new office.

**Acceptance Scenarios**:

1. **Given** a run reaches COMPLETE, **When** the office refreshes, **Then** Project Status shows completion and employees no longer show stale Working, Reviewing, or Validating labels.
2. **Given** a run is blocked, recovering, failed, timed out, cancelled, or needs intervention, **When** the office renders, **Then** the visual treatment is clearly distinct from normal idle or active work and preserves safe useful reason details.
3. **Given** the operator switches from one project to another, **When** the target project has no active run or a different run state, **Then** the previous project's employee status and Project Status data are not displayed.
4. **Given** movement snapshots contain older timestamps, **When** employees are previewed again, **Then** employees do not remain permanently walking.

---

### User Story 3 - Preserve The Spec 135 Office Experience (Priority: P3)

As an operator using the project-company office, I need the Spec 135 office composition and existing interactions to continue working while the new runtime visualization is added.

**Why this priority**: Runtime visualization must improve the rendered office without regressing project entry, portal flows, navigation, or NPC infrastructure.

**Independent Test**: Inspect the office composition and run focused interaction/NPC tests to confirm the physical Engineering, Review, Validation / QA, Project Status, lounge/shared space, reception/exit, and project identity remain intact.

**Acceptance Scenarios**:

1. **Given** the office loads for any selected project, **When** the operator inspects the first viewport, **Then** the Spec 135 physical departments and project-company identity are still visible.
2. **Given** the operator interacts with the project portal, project computer, office exit, camera pan/zoom, or direct click navigation, **When** the live visualization exists, **Then** those existing interactions still work.
3. **Given** employee identities include provider names or swapped agent assignments, **When** the office visualizes work, **Then** semantic roles drive department choice while identity remains separately readable.

### Edge Cases

- No persisted active ADOS run exists for the selected project.
- Persisted status exists but newer execution result evidence exists.
- A terminal COMPLETE state follows an active implementation, validation, or review state.
- Blocked or recovery states include reason codes or safe detail text.
- Provider identity differs from semantic role, such as Claude implementing or Codex reviewing.
- The selected project changes while movement snapshots or employee labels still exist from the previous project.
- Runtime visual state updates after scene refresh, re-entry, or persisted state reload.

## Requirements

### Functional Requirements

- **FR-001**: The office MUST derive visible employee activity from real persisted project/ADOS run state wherever available and MUST NOT use disconnected timer-driven fake workflow progression.
- **FR-002**: The system MUST translate raw project/ADOS state into a normalized semantic office work state before rendering employee locations, labels, and Project Status content.
- **FR-003**: Implementation and implementation-fix states MUST map semantic implementer/engineering roles to Engineering workstations and display Implementing or Working.
- **FR-004**: Validation states MUST map semantic validator/QA roles to Validation / QA destinations and display Validating, Testing, or equivalent.
- **FR-005**: Review states MUST map semantic reviewer roles to the Review destination and display Reviewing without coupling architecture to a specific provider.
- **FR-006**: Publication, pull request, merge, cleanup, and publication-gate states MUST map semantic operations/publication work to Project Status / Operations and display truthful stage progress without fabricated percentages.
- **FR-007**: Blocked, failed, timed-out, cancelled, recovery, or intervention states MUST display a warning/status treatment and safe useful reason details when available.
- **FR-008**: COMPLETE states MUST show completion in Project Status and clear stale active employee labels such as Working, Reviewing, Validating, or Publishing.
- **FR-009**: No-active-run states MUST be visually distinct from an active pipeline and may place employees at semantic idle, home, or shared positions.
- **FR-010**: Employee identity and semantic role MUST remain separable so future implementer/reviewer role swaps or provider changes do not break department mapping.
- **FR-011**: Employee movement MUST reuse the existing NPC/movement infrastructure where safe, and correctness of destination state MUST take precedence over decorative interpolation.
- **FR-012**: The lower-right legacy employee status clutter MUST be replaced or reduced with readable contextual employee-associated labels while preserving useful identity information.
- **FR-013**: The Project Status area MUST display truthful selected-project information when available, including current spec, stage, run state, validation/review/publication state, blocked/recovery details, and completion state.
- **FR-014**: Visualization MUST be project-neutral and driven by the selected project/company rather than hard-coded to Daily Proof or any other example project.
- **FR-015**: Office entry, project switching, scene refresh/re-entry, and run state updates MUST avoid stale state leaks across projects.
- **FR-016**: The Spec 135 rendered office composition MUST be preserved, including Engineering, Review, Validation / QA, Project Status, lounge/shared space, reception/exit, and project-company identity.
- **FR-017**: Existing project registration, persistence, portal, computer interaction, ADOS preparation, trusted local execution, run status, city navigation, pan/zoom, click interaction, NPC infrastructure, and progression systems MUST continue to work.

### Key Entities

- **Semantic Office Work State**: The selected project's normalized run visualization state, including lifecycle, active stage, semantic role assignments, status labels, reason details, and project status display data.
- **Semantic Work Assignment**: A role/location/status binding that maps implementer, reviewer, validator, operations, or idle work to a department destination without coupling role to provider identity.
- **Project Run Snapshot**: The real persisted selected-project ADOS/project status evidence used to derive the semantic work state.
- **Employee Work View Model**: The rendered employee identity, status label, visual treatment, and movement destination derived from semantic work assignments and existing employee/NPC data.
- **Project Status Display**: The office status surface that summarizes truthful selected-project run information and stage pipeline state.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Representative implementation, validation, review, publication, blocked, complete, and no-active-run states each produce the expected department/status outcome in deterministic tests.
- **SC-002**: Switching between two projects with different run states never shows the previous project's active status in the new project's office.
- **SC-003**: COMPLETE and no-active-run states clear all active work labels within one office refresh.
- **SC-004**: Employee labels remain readable and no longer appear as the legacy dense lower-right debug pile during runtime visual verification.
- **SC-005**: The Spec 135 office composition remains visibly intact, with all required departments and shared areas still present.
- **SC-006**: Existing portal and NPC infrastructure tests continue to pass for the surfaces touched by this feature.

## Assumptions

- The selected project remains the source of truth for which persisted ADOS/project run state should be visualized.
- Existing preparation, execution, result, and persisted status collections are sufficient for initial live visualization, with future ADOS normalized stages able to feed the same semantic model.
- Runtime visual verification may be documented rather than automated where browser tooling cannot inject representative persisted states safely in this runtime.
- Full ADOS validation and independent Claude review are performed by ADOS after implementation, per the handoff policy for this runtime.
