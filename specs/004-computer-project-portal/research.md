# Research: Computer Project Portal

## Decision: Use a Phaser screen-space overlay

**Rationale**: The portal opens from a Phaser office object and needs to block Phaser movement/input. Phaser overlay is the smallest implementation that preserves scene behavior without adding React bridge state.

**Alternatives considered**: React overlay or hybrid overlay. Rejected for Phase 10 because there is no real data, selection, routing, or form state yet.

## Decision: Static placeholder data only

**Rationale**: The goal is to establish the portal surface, not integrations. Static data keeps the change safe and reviewable.

**Alternatives considered**: Fetch project, GitHub, Firebase, analytics, or AI agent data. Rejected as future scope.

## Decision: Portal input short-circuits office update

**Rationale**: While open, the portal should own Esc/Space and prevent movement, zoom, exit, and object interactions from firing in the background.

**Alternatives considered**: Let normal office update continue behind the overlay. Rejected because it would allow accidental movement, zoom, or exit.