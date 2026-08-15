# Research: Nearby Employee Talk Bubble Interaction

## Decision: Reuse Existing Conversation Service

**Rationale**: `EmployeeConversationService` already creates deterministic, bounded employee dialogue from employee, task, workstation, schedule, and project context. Reusing it satisfies the feature without introducing real AI calls, persistence, or duplicate state.

**Alternatives considered**: Creating new bubble-specific dialogue text was rejected because it would duplicate conversation rules and drift from the established conversation foundation.

## Decision: Trigger From Existing Action Input

**Rationale**: The office already uses Space as the action control. Reusing it keeps the interaction discoverable and avoids new key binding complexity. Existing exit and object interactions keep priority, with employee talk attempted only when those do not consume the action.

**Alternatives considered**: Adding a new talk key was rejected because the feature is a lightweight v1 and would add unnecessary input surface.

## Decision: Scene-Owned Temporary Overlay

**Rationale**: The scene already coordinates Phaser display objects, movement, portal open state, insight, knowledge, and NPC rendering. A small overlay class keeps bubble rendering isolated while letting the scene hide it when blocking UI opens or time expires.

**Alternatives considered**: Rendering bubbles inside `OfficeEmployeeNpcRenderer` was rejected because the renderer is driven by persistent NPC view models, while speech bubbles are transient interaction display state.
