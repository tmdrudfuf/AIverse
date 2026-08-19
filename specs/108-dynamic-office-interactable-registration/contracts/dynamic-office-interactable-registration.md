# Contract: Dynamic Office Interactable Registration

## Registry Behavior

- `getObjects()` returns the current object list as a defensive copy.
- `registerObject(object)` inserts the object when its id is new.
- `registerObject(object)` replaces the existing object when its id already exists.
- `updateObject(id, changes)` returns the updated object when the id exists.
- `updateObject(id, changes)` returns `undefined` when the id does not exist.
- `removeObject(id)` returns `true` when an object is removed and `false` otherwise.
- `findActiveObject(position)` uses the current enabled object list.

## Interaction Behavior

- The interaction controller refreshes active state from the registry on each update.
- If a previously active object is disabled or removed, the next update clears it.
- Action consumption never returns an interaction result for a stale active object.

## Visual Behavior

- The visual layer can redraw interactive markers from the current registered object list.
- Redraw removes stale interactive markers before adding replacement markers.
- Only enabled computer objects receive computer markers in the current visual layer.

## Non-Goals

- The interaction does not start validation, review, agent runtime, repository mutation, GitHub mutation, publishing, merging, or deployment.
- The interaction does not add new object types or actions.
- The interaction does not persist registry state beyond the current office session.
