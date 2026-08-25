# Data Model: External Project Development Request Draft

## ExternalProjectDevelopmentRequestDraft

Represents a local-only draft request for future development work on an external project.

Fields:

- `id`: Stable request draft id.
- `projectId`: External project id the draft belongs to.
- `projectName`: Display name captured from the project at draft time.
- `status`: Draft lifecycle, initially `Draft`.
- `title`: Short request title.
- `summary`: Request summary shown in the Project Dashboard.
- `repositoryProvider`: Repository identity provider.
- `repositoryOwner`: Optional repository owner.
- `repositoryName`: Optional repository name.
- `branchName`: Optional target branch signal.
- `specPath`: Optional spec path signal.
- `createdAt`: Timestamp when the draft was created.
- `updatedAt`: Timestamp when the draft was last reused or refreshed.
- `sideEffectBoundary`: Human-readable boundary confirming no runtime/repository/GitHub side effects.

Relationships:

- Belongs to one Project Portal project by `projectId`.
- Uses repository identity metadata already associated with that project.

Validation rules:

- One draft per `projectId`.
- Draft can only be created when the project has configured repository identity.
- Draft creation must not create project tasks, execution plans, work sessions, runtime starts, repository syncs, issue syncs, or external side effects.

## State Transitions

- Missing -> Draft: operator activates the configured external project dashboard action.
- Draft -> Draft: repeated activation reuses the existing draft and refreshes `updatedAt` without duplicating it.
