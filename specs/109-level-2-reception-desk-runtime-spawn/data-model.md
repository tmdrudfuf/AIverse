# Data Model: Level 2 Reception Desk Runtime Spawn

## Reception Runtime Desk

Represents the level-gated reception desk interactable.

Fields:

- `id`: Stable id derived from the active layout.
- `type`: Desk interactable type.
- `displayName`: Player-facing label for the prompt and marker.
- `interactionZone`: Rectangular in-office zone derived from the reception layout hint.
- `enabled`: True only when level and unlock conditions pass.
- `action`: Existing workspace-opening action.
- `markerId`: Stable marker id for visual refresh.

Validation rules:

- Must not exist below company level 2.
- Must not exist when reception is absent from unlocked zones.
- Must not exist when the active layout has no reception zone with finite position hints.
- Must be unique by id across repeated refreshes.

## Progression And Layout Inputs

The desk is derived from:

- Current company progression snapshot.
- Active office layout snapshot.
- Office definition bounds.

No new persisted entity is introduced.
