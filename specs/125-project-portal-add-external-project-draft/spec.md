# Feature Specification: Project Portal Add External Project Draft Action

**Feature Branch**: `codex/125-project-portal-add-external-project-draft`

**Created**: 2026-08-24

**Status**: Draft

**Input**: User description: "Project Portal Add External Project Draft Action"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Add an external project draft from the portal (Priority: P1)

As an AIverse operator viewing the Project Portal, I can choose an Add External Project action and see a new external project draft appear in the project list without leaving the portal.

**Why this priority**: Operators need an in-product entry point for adding future external projects; the existing registry capability is not reachable from the portal UI.

**Independent Test**: Open the Project Portal, select the Add External Project action, activate it, and confirm a new planned external project appears in both the project list and registry entries.

**Acceptance Scenarios**:

1. **Given** the Project Portal list is open, **When** the operator selects Add External Project and presses Enter or Space, **Then** one external project draft is added to the portal project list.
2. **Given** an external project draft has been added, **When** the project list is inspected, **Then** the draft is selected and displays its draft owner, local repository label, planned status, and local-only repository identity.

---

### User Story 2 - Keep draft creation idempotent within a session (Priority: P2)

As an operator, I want repeated Add External Project activations to return me to the existing draft rather than filling the project list with duplicate placeholder projects.

**Why this priority**: A draft action is often pressed repeatedly while exploring controls, and duplicate draft records would make portal state confusing.

**Independent Test**: Activate Add External Project twice in the same portal state and confirm there is still exactly one draft with the same identity.

**Acceptance Scenarios**:

1. **Given** an external project draft already exists, **When** the operator activates Add External Project again, **Then** the existing draft remains the only external project draft.
2. **Given** the existing draft is reused, **When** the project selection is inspected, **Then** the existing draft is selected for immediate follow-up.

---

### User Story 3 - Persist the draft through browser session state (Priority: P3)

As an operator, I want the added external project draft to survive the current browser session persistence flow so I do not lose the draft after closing and reopening the portal.

**Why this priority**: The previous persistence slice makes registry entries durable; the add action should use that existing state path.

**Independent Test**: Add a draft, save browser session state, create a fresh portal state from the same storage, and confirm the draft is restored.

**Acceptance Scenarios**:

1. **Given** an external project draft was added, **When** the browser office session is saved and restored, **Then** the draft appears in restored `projects` and `projectRegistryEntries`.
2. **Given** the draft has no remote repository, **When** restored state is inspected, **Then** no repository mapping is created for the draft.

### Edge Cases

- Add External Project is activated when the draft already exists: the existing draft is selected and no duplicate registry entry is created.
- The project list is reopened after draft creation: selection remains bounded and the draft is available from normal project navigation.
- Browser persistence is unavailable or disabled: the draft still appears in the current in-memory portal state.
- Draft creation does not read local files, validate paths, call GitHub, start runtimes, spawn subprocesses, mutate repositories, or mutate GitHub.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Project Portal list MUST expose a selectable Add External Project action.
- **FR-002**: Activating Add External Project MUST add a single planned external project draft to the current portal state.
- **FR-003**: The draft project MUST be represented in both `projectRegistryEntries` and `projects`.
- **FR-004**: The draft MUST use local-only, unknown repository identity metadata until a later binding or registration feature supplies real repository details.
- **FR-005**: Repeated activation MUST NOT create duplicate draft projects with the same draft identity.
- **FR-006**: After activation, the portal MUST select the draft project for immediate inspection.
- **FR-007**: Draft creation MUST use existing browser office session persistence where available.
- **FR-008**: Draft creation MUST NOT read files, call remote services, spawn agent runtimes, mutate repositories, or mutate GitHub.

### Key Entities

- **Add External Project Action**: A selectable Project Portal list action that starts draft creation.
- **External Project Draft**: A planned, local-only registry entry representing an external project before repository binding details are known.
- **Project Portal State**: Existing portal state containing derived project rows, registry entries, and browser-persisted data.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Operators can add an external project draft from the portal list with one selection and one activation.
- **SC-002**: Repeated activation in the same session leaves exactly one external project draft in the portal state.
- **SC-003**: The added draft is visible in a freshly restored portal state in under one reload cycle when browser persistence is available.
- **SC-004**: Draft creation performs zero external repository, filesystem, runtime, or GitHub side effects.

## Assumptions

- This slice creates a single default draft entry; collecting custom project name, repository path, owner, and remote metadata belongs to a later editing or binding feature.
- The draft is a planned project and remains disabled for workspace actions until later registration details make it actionable.
- Existing browser session persistence for project registry entries is reused.
