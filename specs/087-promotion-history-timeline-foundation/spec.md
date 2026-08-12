# Spec 087 - Promotion History & Timeline Foundation

**Feature Branch**: `codex/087-promotion-history-timeline-foundation`

**Created**: 2026-08-11

**Status**: Draft

**Input**: User description: "Promotion History & Timeline Foundation"

## User Scenarios & Testing

### User Story 1 - Inspect Promotion History (Priority: P1)

As the human operator, I need the project dashboard to summarize current and historical Review Promotion activity, so I can tell whether the latest Approved reviewer runtime has been promoted without losing evidence from older promotions or blocked promotion attempts.

**Why this priority**: Promotion is the human gate between review approval and later handoff. Operators need an audit-friendly history signal before any future timeline UI or remote promotion actions are added.

**Independent Test**: Create a historical promotion, complete an Approved post-validation re-review, press Promote twice, and verify the dashboard-facing history reports the historical event, the current granted promotion event, and the idempotent repeat without marking old activity as current.

**Acceptance Scenarios**:

1. **Given** a project has no Review Promotion records or results, **When** promotion history is inspected, **Then** the system reports no promotion activity without fabricating a current promotion.
2. **Given** a project has a historical promotion for an older reviewer runtime, **When** a newer Approved reviewer runtime becomes current, **Then** the historical promotion remains visible as historical and not current.
3. **Given** the human promotes the current Approved reviewer runtime, **When** promotion history is inspected, **Then** the newest granted event is marked current and references the current promotion.
4. **Given** the human presses Promote again for the same current reviewer runtime, **When** promotion history is inspected, **Then** the repeat is represented as an idempotent already-promoted outcome rather than a duplicate promotion.
5. **Given** a Promote request is blocked, **When** promotion history is inspected, **Then** the blocked result is visible as a blocked event without a promotion record.

### Edge Cases

- Historical promotions for older reviewer runtimes MUST remain immutable and visible after a later current promotion is recorded.
- Idempotent repeat results MUST NOT increase the promotion count, but MUST remain visible through the current result state.
- Blocked promotion results without a Review Promotion MUST be visible as blocked history events.
- History and timeline displays MUST NOT imply validation, GitHub, PR, merge, deployment, or publication occurred.
- Missing promotion/result collections MUST be treated as empty collections, not errors.

## Requirements

### Functional Requirements

- **FR-001**: System MUST derive a promotion history from existing Review Promotion and Review Promotion Result records without mutating those records.
- **FR-002**: System MUST identify which promotion, if any, is current for the live Approved review classification.
- **FR-003**: System MUST distinguish current, historical, idempotent already-promoted, and blocked promotion events.
- **FR-004**: System MUST produce deterministic event ordering for repeated reads of unchanged state.
- **FR-005**: System MUST expose a concise project dashboard summary of promotion history when promotion records or results exist.
- **FR-006**: System MUST preserve all existing safety flags showing no validation, repository mutation, GitHub mutation, PR, merge, deployment, or publication started from history inspection.

### Key Entities

- **Review Promotion**: Immutable human promotion record for an Approved reviewer runtime.
- **Review Promotion Result**: Deterministic result of a human Promote request, including granted, already-promoted, or blocked status.
- **Promotion Timeline Event**: Derived read-only history item representing either a promotion-backed event or a result-only blocked event.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A project with no promotion activity reports zero timeline events.
- **SC-002**: A project with one historical promotion and one current promotion reports two promotion-backed timeline events and marks exactly one as current.
- **SC-003**: Repeating Promote for the current reviewer runtime keeps exactly one current promotion record while the timeline reports an already-promoted current outcome.
- **SC-004**: A blocked Promote result appears as one blocked timeline event with no promotion reference.
- **SC-005**: Inspecting promotion history changes zero source promotion records, result records, or downstream execution safety flags.

## Assumptions

- Spec 086 already records the post-validation promotion and idempotent result correctly.
- This foundation adds derived history/timeline read models and a compact dashboard row only; richer navigation or dedicated timeline screens can be built later.
