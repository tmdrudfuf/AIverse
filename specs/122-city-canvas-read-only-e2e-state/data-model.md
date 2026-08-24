# Data Model: City Canvas Read-Only E2E State Probe

## City Canvas Probe State

Represents observable facts about the currently mounted city canvas.

### Fields

- `status`: One of `booting`, `ready`, `skipped`, or `destroyed`.
- `width`: Logical game width when ready.
- `height`: Logical game height when ready.
- `sceneCount`: Number of configured Phaser scenes when ready.
- `canvasCount`: Number of rendered canvas elements inside the host when ready.

### Validation Rules

- `ready` state includes numeric width, height, scene count, and canvas count.
- `skipped` state is used only when a present host does not create a game because boot was cancelled.
- `destroyed` state is used only during component cleanup.
- Probe values are observational and must not be used as authoritative gameplay state.

## Browser Failure Signal

Represents an actionable browser signal collected during the home canvas smoke.

### Fields

- `type`: Console warning, console error, or page error category.
- `text`: Display-safe failure text captured by the existing browser signal filter.

### Validation Rules

- Known benign WebGL warnings remain allowed by the existing filter.
- Console errors, page errors, and unknown warnings remain failures.
