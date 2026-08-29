# Research: Rendered Project Company Office

## Decision: Replace the legacy `OfficeVisualLayer` presentation

**Rationale**: The old layer draws translucent zone rectangles and text-heavy markers over the tilemap, which conflicts with Spec 135. Replacing that presentation locally preserves the scene architecture while changing what users actually see.

**Alternatives considered**: Editing the tilemap asset directly was rejected because the existing Phaser graphics layer can render the required physical composition with less asset churn and lower risk to collision/interaction systems.

## Decision: Use a semantic rendered composition helper

**Rationale**: A typed composition helper gives stable tests for required departments, workstations, furniture density, dynamic signage, and workplace anchors without brittle pixel snapshots.

**Alternatives considered**: Encoding all geometry directly inside `OfficeVisualLayer` was rejected because it would make tests and future ADOS visualization connection harder.

## Decision: Preserve existing interaction and portal controllers

**Rationale**: The feature is visual rendering. Existing click interactions already support opening the project portal without Founder proximity, and preserving those controllers reduces regression risk.

**Alternatives considered**: Reworking interaction semantics was rejected as out of scope.
