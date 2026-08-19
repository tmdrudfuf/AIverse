# Contract: Reception Desk Runtime Spawn

## Derivation Contract

Given an office definition, a company progression snapshot, and an office layout snapshot:

- Return no interactable when company level is below 2.
- Return no interactable when `reception` is not in unlocked office zones.
- Return no interactable when the active layout has no reception zone with finite position hints.
- Return exactly one enabled desk interactable when all gates pass.
- The returned interactable opens the existing workspace/runtime surface.

## Scene Synchronization Contract

When office progression state refreshes:

- Register or replace the reception desk interactable when derivation returns one.
- Remove the previously registered reception desk when derivation returns none.
- Refresh visual markers only when the registered desk state changes.
- Do not start external agent runtimes, validation, review, repository mutation, GitHub mutation, publishing, merging, or deployment.
