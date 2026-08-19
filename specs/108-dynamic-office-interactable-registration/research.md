# Research: Dynamic Office Interactable Registration

## Decision: Keep Registration In The Existing Registry

**Rationale**: `OfficeInteractiveObjectRegistry` already owns object lookup and tilemap/fallback construction. Adding scoped mutation APIs there keeps interaction selection deterministic and avoids duplicating object state in the scene.

**Alternatives considered**: A separate dynamic registry service was rejected because it would split lookup state from existing tilemap object discovery.

## Decision: Replace By Id On Registration

**Rationale**: Office interactables already have stable ids from tilemap marker ids or generated fallback ids. Replacing by id prevents duplicates and supports progression/layout updates that re-register an object with a new zone or enabled state.

**Alternatives considered**: Appending duplicates was rejected because active lookup and marker rendering would become ambiguous.

## Decision: Redraw Visual Markers From Current Objects

**Rationale**: The current visual layer receives a construction-time object list. A refresh method lets the scene or future progression flows keep marker rendering aligned with the registry without reconstructing the whole office layer.

**Alternatives considered**: Rebuilding `OfficeVisualLayer` was rejected because it would unnecessarily recreate the title and exit marker.
