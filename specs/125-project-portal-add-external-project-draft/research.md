# Research: Project Portal Add External Project Draft Action

## Decision: Use a fixed single draft identity for this slice

**Rationale**: The requested feature is an Add External Project draft action, not a full project-registration form. A fixed draft identity keeps the action idempotent, makes the behavior independently testable, and avoids premature decisions about naming, path selection, validation, and repository metadata.

**Alternatives considered**:

- Generate a new draft on every activation: rejected because repeated keypresses would create duplicate placeholders.
- Prompt for custom fields immediately: rejected because no text-entry workflow exists in the Phaser portal and that would broaden the feature.

## Decision: Represent the draft as an existing ProjectRegistryEntry shape

**Rationale**: The portal already derives display projects, repository mappings, and browser-persisted registry entries from `ProjectRegistryEntry`. Reusing that shape avoids a parallel draft model and keeps spec 123 persistence behavior useful.

**Alternatives considered**:

- Add a portal-only draft row: rejected because it would not persist through the registry-backed browser session path.
- Add a new registry service dependency to the controller: rejected for this slice because the controller already owns mutable portal state and only needs to append one well-known entry.

## Decision: Keep the draft local-only and side-effect free

**Rationale**: Existing repository and runtime features are safety-gated. The draft action should not infer, validate, or mutate external resources before the operator supplies explicit repository details in a later feature.

**Alternatives considered**:

- Try to discover a local repository path: rejected because it would require filesystem access and would violate the handoff scope.
- Create a remote repository mapping: rejected because the draft has no remote repository metadata.
