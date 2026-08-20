# Research: Reception Desk Upgrade Benefits Interaction

## Decision: Derive benefits from company progression state

**Rationale**: Company progression already contains the level and unlocked office zones needed to determine whether reception benefits are available. This avoids duplicating unlock state in the desk interactable.

**Alternatives considered**: Hard-code the panel whenever the workspace opens. Rejected because it would show reception benefits before the reception unlock.

## Decision: Render benefits inside the existing workspace surface

**Rationale**: Spec 109 routes the reception desk to the existing workspace. Adding the benefits there keeps the interaction discoverable without adding new navigation state or runtime behavior.

**Alternatives considered**: Create a separate reception modal. Rejected because it would duplicate portal behavior and increase input-handling scope.

## Decision: Keep the interaction passive

**Rationale**: ADOS runtime handoff forbids validation, review, publishing, deployment, GitHub mutation, and external runtime actions from this implementation runtime. Benefit display should communicate unlock value only.

**Alternatives considered**: Trigger runtime preparation from the desk. Rejected as out of scope and contrary to handoff policy.
