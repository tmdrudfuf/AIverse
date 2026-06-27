# Data Model: Office Interactive Objects

## OfficeInteractiveObject

Represents one enabled or disabled office object that can be activated by the Founder.

Fields:

- `id`: Stable runtime ID.
- `type`: Object category such as `computer`, `desk`, `whiteboard`, or `workstation`.
- `displayName`: Prompt label.
- `interactionZone`: Rectangle where the Founder can activate the object.
- `enabled`: Whether the object can become active.
- `action`: Semantic action such as `use_computer`.
- `markerId`: Tilemap marker name that produced the object.

Validation:

- Enabled objects must have a positive-size interaction zone.
- IDs must be deterministic.

## OfficeInteractionResult

Represents the placeholder result produced when an office object is used.

Fields:

- `objectId`: Object that was used.
- `action`: Action that was triggered.
- `status`: `placeholder` for Phase 9.
- `message`: Human-readable debug message.

## OfficeActionInput

Represents a single queued Space action for the office scene.

State:

- `pendingAction`: Set by Space keydown and consumed once per update dispatch.

Validation:

- Space must be captured by one office controller only.
