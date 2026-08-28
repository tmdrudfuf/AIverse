# Data Model: Operator-Driven Office Navigation Foundation

## Navigation Intent

**Description**: Per-frame summary of operator input for city and office navigation.

**Fields**:
- `directionX`: Horizontal keyboard movement direction.
- `directionY`: Vertical keyboard movement direction.
- `panDeltaX`: Pointer drag camera pan delta in screen pixels.
- `panDeltaY`: Pointer drag camera pan delta in screen pixels.
- `zoomDelta`: Keyboard or wheel zoom delta.
- `isMoving`: Whether keyboard movement is active.
- `isPanning`: Whether pointer drag panning is active.
- `source`: Current input source classification: none, keyboard, wheel, pointer, or mixed.

**Validation Rules**:
- Missing or invalid pointer coordinates do not produce pan intent.
- Pending pointer pan deltas are consumed once and then cleared.
- Disabling pointer navigation clears active drag state and pending pan deltas.

## Camera Target

**Description**: Optional world point followed by the camera when avatar-driven navigation is active.

**Fields**:
- `id`: Stable target identifier.
- `position`: World position to center.
- `preferredZoom`: Optional zoom target.

**State Transitions**:
- Set when the Founder should be followed.
- Cleared when the operator pans by pointer.
- Set again when keyboard movement resumes Founder-follow behavior.

## Clickable Building

**Description**: City building that can request office entry from a direct click.

**Validation Rules**:
- Click must be within the building interaction area.
- Building must be active.
- Destination must be enabled.
- Pointer movement must remain within the click threshold.

## Clickable Office Object

**Description**: Office interactive object that can be activated by direct click.

**Validation Rules**:
- Click must be within the object's interaction area.
- Object must still be registered and enabled at consumption time.
- Pointer interaction must be enabled.
- Pointer movement must remain within the click threshold.
