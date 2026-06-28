# Research

## Decision: Derive simulation snapshots from existing state
Rationale: Employee status, task assignment, and work sessions are already maintained. Simulation should not create a second source of truth.
Alternatives considered: Storing independent mutable NPC state was rejected as premature and risky before visible NPCs exist.

## Decision: Keep simulation under employees domain
Rationale: The snapshots describe employee state and future NPC behavior, so the employees domain is the closest existing boundary.
Alternatives considered: A new office-simulation folder was rejected until simulation expands beyond employees.

## Decision: No Phaser or UI integration
Rationale: Phase 25 is a foundation phase. Future office NPC sprites can consume snapshots after a separate design/review phase.