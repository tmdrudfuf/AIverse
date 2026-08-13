# Feature Specification: Company Progression Trigger Foundation

**Feature Branch**: `codex/089-company-progression-trigger-foundation`

**Created**: 2026-08-12

**Status**: Draft

**Input**: User description: "Company Progression Trigger Foundation"

## Current Product Limitation

Company progression is computed from live employee and completed-task counts, and the office dashboard can show current zone unlock progress. The code does not yet provide a stable trigger boundary for threshold-crossing events. Downstream systems that need to react to a level-up would have to compare snapshots themselves, duplicate milestone logic, or fire repeatedly while the company remains at the same level.

## User Scenarios & Testing

### User Story 1 - Detect Company Level-Up Triggers (Priority: P1)

As the simulation, when company inputs cross a progression threshold, I can receive a single structured trigger describing the old level, new level, reached stage, and satisfied milestones.

**Why this priority**: Trigger detection is the foundation future rewards, notifications, knowledge entries, and world-state reactions need before they can safely react to progression.

**Independent Test**: Compare a previous level-1 snapshot with a current level-2 snapshot and confirm exactly one level-up trigger is produced.

**Acceptance Scenarios**:

1. **Given** no previous progression snapshot and a level-1 current snapshot, **When** triggers are evaluated, **Then** no trigger is produced.
2. **Given** a previous level-1 snapshot and a current level-2 snapshot, **When** triggers are evaluated, **Then** one `company_level_reached` trigger is produced with `fromLevel: 1`, `toLevel: 2`, `companyStage: smallOffice`, and level-2 milestones.
3. **Given** a previous level-2 snapshot and another level-2 current snapshot, **When** triggers are evaluated, **Then** no duplicate trigger is produced.

### User Story 2 - Preserve Multi-Level Progression Context (Priority: P2)

As a future consumer, if inputs jump across more than one level at once, I can see every reached level in order rather than only the final level.

**Independent Test**: Compare level 1 to level 4 and confirm level 2, 3, and 4 trigger records are returned in ascending order.

**Acceptance Scenarios**:

1. **Given** a previous level-1 snapshot and a current level-4 snapshot, **When** triggers are evaluated, **Then** triggers for levels 2, 3, and 4 are returned in ascending level order.
2. **Given** a previous level-4 snapshot and a current level-2 snapshot after inputs regress, **When** triggers are evaluated, **Then** no level-up trigger is produced.

### User Story 3 - Surface Latest Triggers Through Portal State (Priority: P3)

As the office portal, I can retain the latest computed progression triggers alongside the existing company dashboard snapshot without changing visible UI.

**Independent Test**: Build a company dashboard snapshot from live state and confirm the portal state stores the current trigger list.

**Acceptance Scenarios**:

1. **Given** the portal refreshes company dashboard data, **When** current progression is evaluated, **Then** state contains a copied list of latest company progression triggers.
2. **Given** progression is unchanged on a later refresh, **When** the dashboard snapshot updates again, **Then** the latest trigger list is empty.

### Edge Cases

- Missing previous snapshot: treated as initialization and does not fire a level-up.
- Same-level refresh: no trigger.
- Downward regression: no trigger, because this foundation only models upward progression trigger events.
- Multi-level jump: one ordered trigger per newly reached level.

## Requirements

### Functional Requirements

- **FR-001**: The system MUST define a provider-neutral `CompanyProgressionTrigger` record for level-up events.
- **FR-002**: Trigger detection MUST compare a previous `CompanyProgressionSnapshot` with a current one and return no trigger when either snapshot is missing, unchanged, or regressed.
- **FR-003**: A level-up trigger MUST include the trigger id, type, source, previous level, reached level, reached company stage, layout id, floor count, max employee count, unlocked zones, and reached-level milestones.
- **FR-004**: When progression advances by more than one level in one evaluation, the system MUST return one trigger per reached level in ascending order.
- **FR-005**: Returned trigger data MUST be copied so consumers cannot mutate progression service internals or portal state by editing returned objects.
- **FR-006**: `OfficeProjectPortalController` MUST update `ProjectPortalState.companyProgressionTriggers` when it computes a company dashboard snapshot, without changing visible UI.
- **FR-007**: The feature MUST NOT run validation, review, publish, merge, deploy, GitHub mutation, or primary-repository mutation from this handoff runtime.

### Key Entities

- **CompanyProgressionTrigger**: A level-up event candidate derived from previous and current progression snapshots.
- **CompanyProgressionTriggerService**: Stateless evaluator that creates ordered trigger records from snapshot transitions.
- **ProjectPortalState.companyProgressionTriggers**: Latest portal-local trigger list for future consumers.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Level 1 to level 2 progression produces exactly one structured trigger.
- **SC-002**: Level 1 to level 4 progression produces exactly three ordered triggers.
- **SC-003**: Same-level and downward progression evaluations produce zero triggers.
- **SC-004**: Portal state stores the latest computed trigger list during company dashboard refresh without introducing a new visible row or control.

## Assumptions

- This is an in-memory foundation only; persistence, notifications, animations, audio, and employee knowledge entries are follow-up scope.
- The existing `CompanyProgressionService` remains the source of truth for level thresholds and evaluated milestones.
- A trigger represents an upward threshold crossing in the current refresh, not "highest level ever reached" persistence.
