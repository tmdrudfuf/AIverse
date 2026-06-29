# Feature Specification: Office Layout & Company Progression Foundation

## User Stories & Testing

### User Story 1 - Establish Startup Office Growth Foundation (Priority: P1)
As a player building the Daily Proof company, I want the office to start as a small startup space and have clear future growth stages so company progress can become visible through larger layouts, unlocked zones, and eventually multi-floor headquarters expansion.

**Independent Test**: Given the company is at its initial stage, the system can describe Level 1 Garage Startup progression, active layout metadata, unlocked office zones, capacity limits, and logical office slots without adding multi-floor navigation, economy, build mode, pathfinding, or Phaser-owned progression logic.

**Acceptance Scenarios**:
1. Given a new company exists, when progression is resolved, then companyLevel is 1, companyStage is Garage Startup, floorCount is 1, maxEmployees supports 4 to 5 employees, and layoutId identifies the Level 1 layout.
2. Given Level 1 is active, when office layout metadata is requested, then it includes entrance, workspace/workstation area, meeting area, and break area zones with deterministic logical slots.
3. Given future company levels are represented, when progression metadata is inspected, then Level 2, Level 3, and Level 4+ expansion metadata can be described without activating multi-floor gameplay.
4. Given existing NPC movement, workstation occupancy, schedule, and conversation systems exist, when the layout foundation is designed, then those systems can later consume layout metadata without becoming owners of layout progression.
5. Given implementation proceeds later, then Phaser renderers can consume layout view models or position hints but do not decide company level, unlock rules, or office layout state.

## Requirements

### Functional Requirements
- FR-001: Company progression MUST be modeled separately from Phaser rendering objects.
- FR-002: Company progression models MUST include companyLevel, companyStage, unlockedOfficeZones, maxEmployees, requiredMilestones, layoutId, and floorCount.
- FR-003: Office layout models MUST include layoutId, stage, floorId, zones, furnitureSlots, workstationSlots, meetingSlots, breakAreaSlots, and entryExitPoints.
- FR-004: Office zone types MUST include entrance, workspace, workstationArea, meetingArea, breakArea, reception, serverArea, storage, and executiveArea.
- FR-005: The initial active stage MUST represent Level 1 Garage Startup as a one-floor office with desks, a small meeting area, a small break area, and employee capacity for 4 to 5 employees.
- FR-006: Future progression metadata MUST represent Level 2 Small Office, Level 3 Growing Company, and Level 4+ Headquarters without requiring those stages to be playable in this phase.
- FR-007: CompanyProgressionService MUST be designed to resolve current company level, expose unlocked office zones, expose active layout metadata, and prepare future expansion unlock rules.
- FR-008: OfficeLayoutService MUST be designed to provide deterministic layout metadata, logical zones, position hints, workstation/furniture slots, and entry/exit metadata for the active company stage.
- FR-009: CompanyProgressionService and OfficeLayoutService MUST NOT depend on Phaser.
- FR-010: Controller-facing code MAY expose getCompanyProgressionSnapshot(), getActiveOfficeLayout(), getOfficeZoneSnapshots(), and getOfficeLayoutPositionHints() or equivalent methods.
- FR-011: Renderer-facing behavior MUST be limited to consuming layout metadata, rendering later furniture/zone markers, and cleaning up display objects; renderers MUST NOT decide progression logic or mutate company progression.
- FR-012: Existing employee simulation, NPC movement, workstation occupancy, daily schedule, conversation, project portal, task, and work-session behavior MUST remain unchanged except for future-ready layout metadata becoming available in a later implementation phase.

### Non-Goals
- No source implementation in this architect phase.
- No multi-floor navigation, elevators, stairs, pathfinding, furniture sprites, purchase/build mode, economy, payroll, real AI calls, map editor, save/load persistence, or floor switching gameplay.

## Success Criteria
- SC-001: The implementation plan can be executed as a small isolated PR that adds progression/layout metadata without changing current gameplay.
- SC-002: Review can verify that Phaser remains view-only and neither CompanyProgressionService nor OfficeLayoutService depends on Phaser.
- SC-003: Level 1 Garage Startup metadata can describe a compact one-floor office with 4 to 5 employee capacity and core zones.
- SC-004: Future Level 2, Level 3, and Level 4+ metadata can be represented without enabling complex multi-floor gameplay.
- SC-005: Existing NPC movement, workstation, schedule, and conversation systems can later consume layout metadata without owning progression or duplicating layout state.

## Assumptions
- The initial implementation can be deterministic and mock-first.
- Level 1 can improve the current office screenshot through metadata and later simple view models without replacing the tilemap immediately.
- Company unlock criteria can start as placeholder milestones and become tied to tasks, revenue, headcount, or simulation later.
- FloorCount is included now for future expansion, but active gameplay remains one floor in this phase.