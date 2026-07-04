# Feature Specification: Movement Preview Timestamp Consistency

**Feature Branch**: `codex/movement-preview-timestamps`
**Created**: 2026-07-04
**Status**: Draft
**Input**: Prevent AI movement previews from using a fixed past timestamp that can leave preview-backed employee states stale.

## User Story

As a player observing employees in the office, I want Employee AI, Insight, Knowledge, and conversation preview state to reflect the current office simulation timing so employees do not appear stuck in stale walking states.

## Acceptance Criteria

1. Employee movement previews use a timestamp derived from the movement and simulation snapshots being previewed.
2. Preview-backed Employee AI state no longer falls back to a fixed historical timestamp when current simulation state is available.
3. Employee Insight, Knowledge, and conversation preview paths continue to use read-only preview snapshots without mutating persisted office services.
4. Existing office movement, dashboard, and employee state tests continue to pass.

## Requirements

- **REQ-001**: The portal controller MUST derive preview timestamps from the latest known movement snapshot timestamp and existing employee simulation snapshot timestamp.
- **REQ-002**: The portal controller MUST avoid fixed historical fallback timestamps for movement preview calls.
- **REQ-003**: The timestamp strategy MUST preserve read-only preview semantics for movement, workstation, schedule, Employee AI, Insight, Knowledge, and conversation composition.
- **REQ-004**: Regression coverage MUST prove preview-backed Employee AI timestamps use current simulation timing when movement snapshots are not yet available.

## Out of Scope

- Changing employee movement physics or arrival duration.
- Changing NPC positions, schedules, work sessions, or project/task state.
- Adding UI, player controls, or new simulation state.
