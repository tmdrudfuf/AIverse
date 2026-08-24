# Contract: City Canvas E2E State Probe

The city canvas host exposes a passive read-only probe through `data-*` attributes.

## Host Selector

`.city-scene-canvas`

## Attributes

- `data-aiverse-city-canvas-state`: `booting`, `ready`, `skipped`, or `destroyed`.
- `data-aiverse-city-canvas-width`: Present in `ready` state. Expected value: `1200`.
- `data-aiverse-city-canvas-height`: Present in `ready` state. Expected value: `720`.
- `data-aiverse-city-canvas-scene-count`: Present in `ready` state. Expected value: `2`.
- `data-aiverse-city-canvas-rendered-count`: Present in `ready` state. Expected value: `1`.

## Read-Only Boundary

- The probe exposes no functions, event handlers, controls, storage writes, network calls, repository mutation, or GitHub mutation.
- Browser checks may read the attributes but must not rely on them as gameplay source state.
- Existing browser signal filtering remains authoritative for console and page failure detection.
