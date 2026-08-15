# Research: NPC Workstation Task Animation

## Decision: Derive Animation State In Existing NPC View Models

**Rationale**: The office already composes employee simulation, workstation, schedule, and movement state before rendering NPCs. Adding display-only animation state there keeps the decision close to the data that determines whether a worker has arrived at a workstation.

**Alternatives considered**: A separate scene controller was rejected because it would duplicate NPC lookup and lifecycle management already handled by `OfficeEmployeeNpcRenderer`.

## Decision: Render Lightweight Phaser Placeholder Indicators

**Rationale**: Current NPCs are rectangle placeholders with text labels. A small attached indicator gives immediate work feedback without introducing new art assets or changing the existing visual system.

**Alternatives considered**: New sprite sheets and custom animation assets were deferred because the feature only requires visible task activity and the current project convention uses placeholder geometry for NPCs.

## Decision: Keep Animation Read-Only

**Rationale**: The animation is a projection of existing employee, task, movement, and workstation state. It must not advance work sessions, mutate task status, or change office occupancy.

**Alternatives considered**: Driving work progress from animation ticks was rejected because task progression belongs to existing task and runtime services.
