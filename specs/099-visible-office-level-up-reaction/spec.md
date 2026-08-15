# Feature Specification: Visible Office Level-Up Reaction

**Feature Branch**: `codex/099-visible-office-level-up-reaction`

**Created**: 2026-08-14

**Status**: Draft

**Input**: User description: "Visible Office Level-Up Reaction"

## Current Product Limitation

Company progression can already produce level-up triggers, rewards, event-feed records, and a static office progression HUD. When a level-up happens while the player is in the office, the office still does not provide an immediate celebratory reaction tied to the new level. Players may only notice the change by reading the dashboard or the static state panel.

## User Scenarios & Testing

### User Story 1 - See A Level-Up Reaction In The Office (Priority: P1)

As a player who causes company progression to reach a new level while inside the office, I can see an immediate in-office reaction that names the reached level and core reward context.

**Why this priority**: This is the visible confirmation that office-side progression events happened without requiring the player to leave the office or inspect dashboard text.

**Independent Test**: Create a level-up trigger and confirm the office reaction view model is visible with the reached level, formatted stage, capacity, floor count, and unlocked-zone summary.

**Acceptance Scenarios**:

1. **Given** the company reaches a new progression level, **When** the office scene refreshes visible progression state, **Then** a level-up reaction is shown in the office.
2. **Given** the level-up trigger includes reached-level context, **When** the reaction is rendered, **Then** it displays the reached level, company stage, employee capacity, floor count, and unlocked-zone summary.
3. **Given** multiple level-up triggers are available, **When** the reaction is rendered, **Then** the newest reached level is shown.

---

### User Story 2 - Hide Empty Reaction State (Priority: P2)

As a player in the office with no current level-up trigger, I should not see an empty or stale reaction panel.

**Independent Test**: Create the reaction view model with no triggers and confirm it is hidden with empty labels.

**Acceptance Scenarios**:

1. **Given** there are no current level-up triggers, **When** the office scene refreshes, **Then** no level-up reaction is visible.
2. **Given** a previous reaction was visible and the current trigger list becomes empty, **When** the reaction updates, **Then** the previous text is cleared.

---

### User Story 3 - Keep Reaction Read-Only And Bounded (Priority: P3)

As the office scene updates repeatedly, the level-up reaction stays a bounded read-only projection of copied trigger data and does not mutate progression triggers.

**Independent Test**: Mutate a returned reaction view model, regenerate it from the same trigger, and confirm the source trigger and regenerated labels are unchanged.

**Acceptance Scenarios**:

1. **Given** a level-up trigger contains many unlocked zones, **When** the reaction is generated, **Then** the unlocked-zone summary is bounded for the compact office HUD.
2. **Given** UI code mutates the returned reaction view model, **When** the model is regenerated from the same trigger, **Then** the source trigger remains unchanged.
3. **Given** the project portal overlay is open, **When** the reaction refreshes, **Then** it does not replace portal content or intercept portal input.

### Edge Cases

- No triggers: reaction is hidden and any prior text is cleared.
- Multiple triggers: reaction uses the highest/newest reached level in trigger order.
- Long unlocked-zone lists: reaction summarizes zone count instead of listing every zone.
- Existing office title, exit marker, interaction prompt, NPCs, progression visual state, and portal UI remain intact.
- Runtime handoff constraints: validation, review, publishing, merge, deployment, GitHub mutation, and primary-repository mutation remain outside this runtime.

## Requirements

### Functional Requirements

- **FR-001**: The office scene MUST render a visible level-up reaction when current company progression triggers are present.
- **FR-002**: The reaction MUST display the newest reached level, formatted company stage, employee capacity, floor count, and unlocked-zone summary from the trigger.
- **FR-003**: The reaction MUST hide itself when no current level-up triggers are present.
- **FR-004**: The reaction MUST keep text bounded for compact office HUD placement and must not cover or replace existing office progression visual state.
- **FR-005**: The reaction MUST consume copied trigger records without mutating source progression trigger data.
- **FR-006**: The feature MUST NOT add persistence, network calls, review automation, publishing, deployment, GitHub mutation, or primary-repository mutation.

### Key Entities

- **Office Level-Up Reaction**: A compact in-scene reaction shown when current progression triggers exist.
- **Reaction View Model**: Display-safe labels derived from one selected level-up trigger.
- **Company Progression Trigger Snapshot**: Existing copied level-up trigger data used as the reaction source.

## Success Criteria

### Measurable Outcomes

- **SC-001**: One level-up trigger produces one visible reaction naming the reached level.
- **SC-002**: The reaction includes stage, capacity, floor, and unlocked-zone summary labels.
- **SC-003**: An empty trigger list produces no visible reaction.
- **SC-004**: More than one trigger displays the newest reached level.
- **SC-005**: Regenerating the reaction after mutating a returned view model produces the original labels again.

## Assumptions

- The current `CompanyProgressionTrigger` list is the correct source of truth for office-side level-up reactions.
- The first implementation uses Phaser scene objects inside the office scene and no new tilemap art.
- Animation timing, dismissal controls, durable notification history, sound effects, and new art are follow-up scope.
