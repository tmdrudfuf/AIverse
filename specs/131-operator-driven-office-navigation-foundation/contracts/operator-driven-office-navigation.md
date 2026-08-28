# Contract: Operator-Driven Office Navigation

## City Scene Contract

- Pointer drag on the scene surface produces one-frame camera pan intent.
- Pointer drag does not move the Founder.
- Pointer pan clears the current Founder camera follow target.
- Keyboard movement restores Founder camera follow behavior.
- Direct click on an active enabled building queues one building entry request.
- Direct click on disabled or inactive buildings queues no entry request.
- Pointer movement greater than the click threshold is treated as drag, not click.

## Office Scene Contract

- Pointer drag on the scene surface produces one-frame camera pan intent.
- Pointer drag does not move the Founder.
- Direct click on an enabled workspace-capable office object opens the project workspace portal.
- Proximity plus keyboard action remains supported.
- When the project workspace portal is open, pointer panning and pointer office object interaction are disabled.
- When the project workspace portal is closed, pointer panning and pointer office object interaction are re-enabled.

## Non-Goals

- No persistence changes.
- No new office object types.
- No repository, GitHub, ADOS validation, review, publish, merge, or deploy action.
