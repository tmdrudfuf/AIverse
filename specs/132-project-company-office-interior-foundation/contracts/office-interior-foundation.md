# Contract: Office Interior Foundation

## Office Definition Contract

An office definition may include `interiorFoundation`.

Required behavior:

- Offices without `interiorFoundation` render normally.
- Offices with `interiorFoundation.zones` render enabled zones as passive visual markers.
- Zone markers do not register pointer handlers and do not participate in interaction selection.
- Runtime callers that read foundation zones receive copies, not mutable references to office configuration.

## Daily Proof Foundation Contract

Daily Proof office includes these enabled roles:

- `reception`
- `founder-desk`
- `workspace`
- `employee-desk`

The workspace role remains visually distinct from existing computer/workspace interactables but does not replace them.
