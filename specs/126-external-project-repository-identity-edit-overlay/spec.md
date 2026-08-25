# Feature Specification: External Project Repository Identity Edit Overlay

**Feature Branch**: `codex/126-external-project-repository-identity-edit-overlay`

**Created**: 2026-08-24

**Status**: Draft

**Input**: User description: "External Project Repository Identity Edit Overlay"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Edit Draft Repository Identity (Priority: P1)

As an AIverse operator who just added an external project draft, I can open a repository identity edit overlay for that draft and choose a bounded identity option so the draft is no longer stuck with unknown repository metadata.

**Why this priority**: The draft from Spec 125 exists only as a placeholder until an operator can assign repository identity metadata.

**Independent Test**: Add or select the external project draft, open its dashboard action, apply a repository identity option, and verify the selected draft row and registry entry display the updated identity.

**Acceptance Scenarios**:

1. **Given** the external project draft is selected and still has unknown local repository identity, **When** the operator activates the draft dashboard action, **Then** a repository identity edit overlay is shown with selectable identity choices and the current identity summary.
2. **Given** the edit overlay is open, **When** the operator chooses the local AIverse worktree identity, **Then** the draft registry entry and derived portal project show a configured local repository identity and local repository label.

---

### User Story 2 - Cancel Without Mutation (Priority: P2)

As an AIverse operator reviewing repository identity choices, I can back out of the overlay without changing the draft.

**Why this priority**: Repository identity is operationally important; accidental edits should be avoidable.

**Independent Test**: Open the edit overlay for the draft, press back, and confirm the draft identity remains unchanged.

**Acceptance Scenarios**:

1. **Given** the repository identity edit overlay is open, **When** the operator presses back, **Then** the portal returns to the project dashboard and no repository identity fields are changed.

---

### User Story 3 - Persist Edited Identity (Priority: P3)

As an AIverse operator, I can reload a browser session after editing the draft identity and still see the edited repository identity.

**Why this priority**: Spec 125 made external drafts browser-session persistent; repository identity edits must use the same continuity path.

**Independent Test**: Apply an identity option to the draft, save/restore browser office session state, and verify the restored registry entry and portal project retain the edited identity.

**Acceptance Scenarios**:

1. **Given** the draft identity has been edited, **When** the browser office session state is restored, **Then** the restored draft keeps its repository identity, local repository label, and selected project state.

### Edge Cases

- If the draft does not exist yet, the edit overlay is not opened and no registry mutation occurs.
- If the operator chooses the existing unknown identity option, the draft returns to a local unknown identity without creating a remote repository mapping.
- Editing repository identity must not read the filesystem, contact GitHub, start agents, mutate repositories, or mutate GitHub.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The portal MUST expose a repository identity edit overlay for the external project draft from its project dashboard action path.
- **FR-002**: The overlay MUST show the draft's current repository identity summary and a bounded set of selectable identity choices.
- **FR-003**: The operator MUST be able to move between identity choices and apply exactly one selected choice.
- **FR-004**: Applying the local AIverse worktree choice MUST update the draft repository identity to a configured local identity and mark the local repository label as connected.
- **FR-005**: Applying the unknown local choice MUST preserve a local-only unknown repository identity and avoid creating a remote repository mapping.
- **FR-006**: Cancelling the overlay MUST leave the draft registry entry, derived portal project, repository mappings, and browser session state unchanged.
- **FR-007**: Applied identity edits MUST be reflected in both `projectRegistryEntries` and derived `projects`.
- **FR-008**: Applied identity edits MUST use the existing browser office session persistence path.
- **FR-009**: The feature MUST NOT perform filesystem checks, network reads, GitHub reads, repository writes, runtime starts, or agent starts.

### Key Entities

- **External Project Draft**: The planned project row created by Spec 125, identified by its stable draft project id.
- **Repository Identity Choice**: A bounded operator-selectable identity option that can update provider, owner/name, default branch, URL, local path, connection state, and local repository label.
- **Repository Identity Edit Overlay State**: The transient selection state used while choosing an identity option; it is not a separate persisted entity.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Operators can open the edit overlay for the external project draft and apply an identity choice in no more than three portal actions after the draft is selected.
- **SC-002**: After applying an identity choice, 100% of visible draft repository identity rows reflect the chosen identity immediately.
- **SC-003**: Cancelling the overlay leaves 100% of repository identity fields unchanged.
- **SC-004**: A browser session restore retains 100% of edited draft repository identity fields supported by the existing project registry model.

## Assumptions

- The first version uses bounded selectable identity choices because the current portal input model does not support free-form text entry.
- The local AIverse worktree choice represents operator-provided metadata only; it is not a live filesystem verification.
- The existing browser office session storage is the persistence mechanism for edited draft identity.
