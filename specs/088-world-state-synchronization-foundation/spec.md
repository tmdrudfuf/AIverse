# Spec 088 - World State Synchronization Foundation

**Feature Branch**: `codex/088-world-state-synchronization-foundation`

**Created**: 2026-08-12

**Status**: Draft

**Input**: User description: "World State Synchronization Foundation"

## User Scenarios & Testing

### User Story 1 - Inspect Synchronized World State (Priority: P1)

As the human operator, I need AIverse to maintain an honest, inspectable snapshot of the currently rendered city world, so future features can reason about world identity, spaces, buildings, and the Founder without reverse-engineering Phaser drawing code.

**Why this priority**: Architecture decisions already identify missing `WorldState` as a blocker for durable city behavior. The first foundation must establish a read-only synchronized projection before new interaction, persistence, networking, or AI integration builds on it.

**Independent Test**: Create a city world snapshot from configured bounds, buildings, and Founder state; update the Founder position; verify the latest snapshot changes only when the world facts change and preserves copied building/actor data.

**Acceptance Scenarios**:

1. **Given** the city scene is created with known world bounds and building definitions, **When** world state is synchronized, **Then** the snapshot reports the active world, active world space, scene key, bounds, building identities, and a successful sync status.
2. **Given** the Founder position changes, **When** world state is synchronized again, **Then** the snapshot reports the new Founder position with a newer synchronization timestamp.
3. **Given** world facts have not changed since the last synchronization, **When** synchronization is requested again, **Then** the existing snapshot remains stable rather than creating a duplicate update.
4. **Given** a caller mutates source building or actor objects after synchronization, **When** the snapshot is inspected, **Then** the snapshot remains unchanged.

### Edge Cases

- Missing or invalid Founder state MUST NOT prevent building and world-space state from synchronizing.
- Disabled buildings MUST remain visible in the snapshot with their disabled destination state; synchronization MUST NOT imply they are enterable.
- Synchronization MUST NOT persist data, call external services, execute tools, mutate repositories, or start any AI workflow.
- Runtime-only camera velocity and input intent MUST stay outside synchronized world state.
- Repeated reads of unchanged world facts MUST be deterministic.

## Requirements

### Functional Requirements

- **FR-001**: System MUST expose a provider-neutral `WorldStateSnapshot` representing the active world, active world space, scene key, world bounds, buildings, actors, synchronization status, last successful synchronization time, and optional error summary.
- **FR-002**: System MUST include building state with stable identity, display name, type, position, size, active flag, destination-enabled flag, and optional company/project association.
- **FR-003**: System MUST include actor state for the Founder when a valid Founder state is available, including stable identity, role, position, and optional facing direction.
- **FR-004**: System MUST defensively copy synchronized buildings, actors, positions, sizes, and bounds so later source mutations cannot alter prior snapshots.
- **FR-005**: System MUST avoid creating a new successful snapshot when synchronized world facts are semantically unchanged from the latest successful snapshot.
- **FR-006**: System MUST distinguish `NotStarted`, `Syncing`, `Succeeded`, `Failed`, and `Unavailable` world synchronization states.
- **FR-007**: System MUST keep synchronization read-only and MUST NOT introduce persistence, networking, repository mutation, GitHub mutation, validation execution, review execution, publication, merge, deployment, or AI runtime starts.

### Key Entities

- **World State Snapshot**: Read-only projection of the active city world state at a synchronization point.
- **World Space State**: The active navigable space rendered by a scene, including bounds and scene identity.
- **World Building State**: Durable representation of configured building identity and location, independent of drawing code.
- **World Actor State**: Durable representation of a visible actor such as the Founder, excluding frame-level movement intent.
- **World State Synchronization Result**: Outcome describing whether synchronization produced a new snapshot, reused the existing one, or degraded safely.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A synchronized city scene reports exactly one active world, one active world space, three configured buildings, and one Founder actor when the Founder is present.
- **SC-002**: Updating the Founder position produces exactly one changed successful snapshot whose Founder coordinates match the latest valid position.
- **SC-003**: Re-synchronizing unchanged world facts returns the same last successful synchronization timestamp and reports no semantic change.
- **SC-004**: Mutating source objects after synchronization changes zero fields in the previously returned snapshot.
- **SC-005**: World state synchronization starts zero validation commands, review commands, external network calls, repository writes, GitHub mutations, publications, merges, or deployments.

## Assumptions

- The first synchronized world is the existing city world scene, not office interiors.
- Building definitions already provide enough identity and spatial data for a foundation snapshot.
- Founder state is the only actor included in this feature; employees, office NPCs, tasks, schedules, and workflow timelines can be added by later specs.
- Snapshots are in-memory read models only; durable persistence and real-time transport are deferred.
