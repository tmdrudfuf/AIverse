# Data Model: Dynamic Office Interactable Registration

## OfficeInteractiveObject

Represents an in-session object the founder can interact with.

Fields:

- `id`: Stable unique id for registration, update, and removal.
- `type`: Existing supported type: computer, desk, whiteboard, or workstation.
- `displayName`: Prompt and marker label.
- `interactionZone`: Rectangular world-space interaction area.
- `enabled`: Whether the object participates in lookup and marker rendering.
- `action`: Existing supported action: use computer, inspect, or open workspace.
- `markerId`: Source marker id or generated fallback marker id.

Validation rules:

- `id` must be unique in the registry.
- Disabled objects remain registered but do not become active.
- Updated objects preserve unchanged fields.

## OfficeInteractiveObjectRegistry

Represents the current in-memory set of interactable objects for an office scene.

State transitions:

- `register`: Adds a new object or replaces an existing object with the same id.
- `update`: Merges a partial object update into an existing object.
- `remove`: Deletes an object by id.
- `findActiveObject`: Reads the current object set and returns the nearest enabled object containing the founder position.

## VisualMarkerSet

Represents rendered office markers for currently enabled interactables.

State transitions:

- `render`: Replaces previous interactive markers with markers for the provided current object list.
- `destroy`: Removes all title, exit, and interactive markers.
