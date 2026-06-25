# Implementation Plan: City Navigation

**Branch**: `001-city-navigation` | **Date**: 2026-06-25 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-city-navigation/spec.md`

**Planning Scope**: Implementation plan only. This artifact defines architecture and technical design for the feature. It does not generate tasks, modify application code, or create runtime behavior.

## Summary

Create a modular navigation foundation for AI City's 2D top-down world. The implementation should turn the current city view into a navigable world surface with camera movement, WASD and arrow key input, zoom controls, bounded viewport behavior, and a small navigation state model. The design must keep navigation independent from future Founder, Building, NPC, AI Agent, and Company Interior systems so those systems can plug into the world later without replacing the camera or input foundation.

The core approach is to separate the city scene into small engine-like modules:

- Scene composition owns Phaser scene lifecycle and world assembly.
- Camera control owns viewport movement, bounds, smoothing, and zoom.
- Input control owns keyboard and zoom intent collection.
- Navigation state owns current camera/navigation values and reusable configuration.
- World layers own visual city content without controlling navigation behavior.

## Technical Context

**Language/Version**: TypeScript 5.8.3

**Primary Dependencies**: Next.js 16.2.9, React 19.2.7, Phaser 3.90.0

**Storage**: N/A for this feature. Navigation state is runtime-only and does not require persistence.

**Testing**: TypeScript check and production build for static validation; browser/manual validation for movement, bounds, zoom, and page-scroll prevention. Automated tests may be added later when the project has a browser test harness.

**Target Platform**: Desktop web browser with keyboard input.

**Project Type**: Web application with client-rendered Phaser scene embedded in a Next.js app.

**Performance Goals**: Maintain smooth-feeling navigation during 30 seconds of continuous movement and zoom. The user should not experience jumps, jitter, or uncontrolled acceleration during ordinary navigation.

**Constraints**:

- Do not add Founder behavior.
- Do not add building entry, selection, inspection, or interaction.
- Do not add NPCs, agent characters, autonomous movement, or character interaction.
- Do not add AI integration, task execution, tool activity, or external services.
- Keep keyboard navigation from causing unintended page scrolling while the city view is focused.
- Keep architecture modular enough for later world systems.

**Scale/Scope**: One initial top-down city scene with a bounded world larger than or equal to the visible viewport. The design should support later expansion to multiple districts, company buildings, entity-aware camera behavior, and interior scenes.

## Constitution Check

*GATE: Must pass before implementation. Re-check after final design before tasks are generated.*

### I. Spec First

PASS. The approved specification exists at `specs/001-city-navigation/spec.md` and defines user scenarios, requirements, success criteria, assumptions, and explicit exclusions.

### II. Plan Before Code

PASS. This plan describes the technical approach before implementation. No application code changes are part of this planning step.

### III. Tasks Gate Implementation

PASS. Implementation must not begin until `/speckit-tasks` creates `specs/001-city-navigation/tasks.md`. This plan does not contain executable task checklists.

### IV. Preserve Application Stability

PASS. The planned implementation is scoped to the city-view feature area and supporting navigation modules. Existing unrelated source changes must be preserved.

### V. Validation Is Required

PASS. Validation gates are defined in this plan: TypeScript check, build, focused browser validation, and acceptance checks mapped to the feature specification.

## Architecture Changes

The current city view has Phaser setup, scene drawing, camera movement, input handling, and zoom behavior concentrated inside the scene factory. The implementation should preserve visible behavior while moving responsibilities into named modules that match AI City's long-term architecture direction.

### Target Layering

```text
Next.js route/page
  -> CityView React shell
    -> CitySceneCanvas Phaser host
      -> CityWorldScene Phaser scene
        -> world/layers for visual city content
        -> navigation/camera controller
        -> navigation/input controller
        -> navigation/navigation state
        -> shared world config and bounds
```

### Responsibility Boundaries

- `CityView` remains the React-facing city screen shell. It should not own Phaser camera math or input rules.
- `CitySceneCanvas` remains the client-only Phaser mount point. It should create and destroy the Phaser game cleanly.
- `CityWorldScene` owns Phaser lifecycle methods and composes world layers plus navigation modules.
- Navigation modules own camera movement, zoom, bounds, smoothing, and input interpretation.
- World layer modules own scenery drawing and later object placement, but must not directly own camera behavior.
- Shared types/config define world dimensions, zoom limits, movement speed, and input bindings.

### Design Rule

Navigation is a view-control system, not an entity interaction system. Future entities can influence camera targets or bounds through explicit interfaces, but entities should not be coupled directly into keyboard input handling.

## Project Structure

### Documentation (this feature)

```text
specs/001-city-navigation/
|-- spec.md
|-- plan.md
`-- checklists/
    `-- requirements.md
```

No `tasks.md` is created by this step.

### Planned Source Code Shape

The implementation should stay under the existing `src/features/city-view` boundary and split scene concerns into focused modules.

```text
src/features/city-view/
|-- CityView.tsx
|-- CitySceneCanvas.tsx
|-- scene/
|   |-- CityWorldScene.ts
|   |-- createCityScene.ts
|   |-- config/
|   |   |-- cityWorldConfig.ts
|   |   `-- navigationConfig.ts
|   |-- layers/
|   |   |-- CityGroundLayer.ts
|   |   |-- CityRoadLayer.ts
|   |   |-- CityBuildingLayer.ts
|   |   `-- CityDecorationLayer.ts
|   |-- navigation/
|   |   |-- CameraController.ts
|   |   |-- NavigationInputController.ts
|   |   |-- NavigationState.ts
|   |   `-- navigationTypes.ts
|   `-- shared/
|       |-- geometry.ts
|       `-- phaserTypes.ts
```

### Structure Decision

Use a feature-local scene architecture for this feature. Do not introduce a global engine package or full entity-component system yet. The module names should point toward the future Engine/Game/UI split from `PROJECT_BIBLE.md`, but the implementation should remain scoped to the existing `city-view` feature until repeated needs justify extracting shared engine modules.

## Scene Organization

### CityWorldScene

`CityWorldScene` should be the single Phaser scene for the exterior city navigation feature. It should:

- Initialize world dimensions and camera bounds.
- Create visual layers in a deterministic order.
- Initialize navigation state.
- Register navigation input.
- Update camera movement and zoom each frame.
- Dispose input listeners when the scene shuts down.

It should not:

- Know about Founder-specific behavior.
- Open buildings or interiors.
- Create NPCs or AI agents.
- Trigger AI or task workflows.
- Contain large blocks of drawing logic that belong to layer modules.

### World Layers

Split visual drawing into simple layer modules. These modules should receive scene/runtime context and config, then create their own Phaser display objects.

Recommended layers:

- `CityGroundLayer`: grass/base tiles/background.
- `CityRoadLayer`: roads, sidewalks, crosswalks, route-like visual structure.
- `CityBuildingLayer`: non-interactive building visuals and labels.
- `CityDecorationLayer`: trees, signs, ambient objects, district labels.

Layer modules should return created objects or containers where useful. Future features can add an entity or interaction layer above these without rewriting the base scene.

### Future Scene Expansion

Future company interiors should be separate scenes or scene modes, not bolted into the exterior navigation scene. The exterior scene can later expose scene transition intents, but this feature must not implement building entry.

## Camera System Design

### CameraController

Create a `CameraController` responsible for translating navigation state into Phaser camera updates.

Responsibilities:

- Own camera movement speed, smoothing, and bounds enforcement.
- Convert normalized directional input into camera velocity.
- Normalize diagonal movement so diagonal travel is not faster than cardinal travel.
- Clamp camera scroll to the navigable world bounds.
- Apply zoom changes while preserving the user's current area of interest.
- Provide future extension points for following an entity or focusing a location.

Suggested public surface:

```text
CameraController.update(deltaMs, navigationIntent)
CameraController.setBounds(bounds)
CameraController.setZoomTarget(zoom)
CameraController.focusWorldPoint(point, options)
CameraController.destroy()
```

This is a design interface, not implementation code for this planning step.

### Bounds Model

Represent navigable bounds as world-space dimensions independent from Phaser globals. Camera bounds should come from config/state so future district maps and interiors can provide different bounds.

```text
WorldBounds
- x
- y
- width
- height
```

For this feature, bounds describe the exterior city world only.

### Movement Behavior

- Movement input creates a direction vector.
- Direction vector is normalized before speed is applied.
- Camera velocity interpolates toward target velocity for smooth starts/stops.
- Final scroll is clamped after movement and after zoom changes.
- Opposite directions on one axis cancel that axis or resolve consistently according to input state.

## Input Handling

### NavigationInputController

Create a `NavigationInputController` responsible for collecting user intent. It should not move the camera directly.

Responsibilities:

- Register WASD and arrow keys.
- Capture movement keys while the city view is active to prevent page scrolling.
- Track horizontal and vertical movement intent.
- Track zoom-in and zoom-out intent.
- Listen for wheel zoom intent when the pointer is over the city canvas.
- Provide a normalized `NavigationIntent` object each frame.
- Clean up keyboard and wheel listeners on scene shutdown.

Suggested intent shape:

```text
NavigationIntent
- directionX: -1 | 0 | 1
- directionY: -1 | 0 | 1
- zoomDelta: number
- isMoving: boolean
- source: keyboard | wheel | mixed | none
```

### Input Bindings

Initial bindings:

- Move up: `W`, arrow up
- Move down: `S`, arrow down
- Move left: `A`, arrow left
- Move right: `D`, arrow right
- Zoom in: keyboard binding and wheel upward intent
- Zoom out: keyboard binding and wheel downward intent

The exact keyboard zoom keys can stay aligned with the existing UI hints during implementation, but bindings should live in configuration so they can be changed later without rewriting camera code.

### Future Input Support

The controller should allow future input sources such as mouse drag panning, touch gestures, controller input, minimap clicks, or entity focus commands. These future inputs should produce the same `NavigationIntent` or explicit camera commands rather than bypassing the camera controller.

## Zoom System

### ZoomController Responsibility

Zoom can be part of `CameraController` for this feature, but keep the logic internally isolated so it can become a separate `ZoomController` later if the behavior grows.

Responsibilities:

- Maintain a target zoom value.
- Clamp target zoom between configured minimum and maximum values.
- Smoothly interpolate the actual camera zoom toward the target.
- Preserve the camera's visual center or current area of interest while zoom changes.
- Re-clamp scroll after zoom changes because visible world size changes with zoom.

### Zoom Configuration

Store zoom values in config:

```text
NavigationConfig
- minZoom
- maxZoom
- initialZoom
- keyboardZoomSpeed
- wheelZoomStep
- zoomSmoothing
- movementSpeed
- movementSmoothing
```

### Future Zoom Extensions

Future features may add:

- Zoom-to-building without selecting or entering the building.
- Zoom-to-Founder after Founder exists.
- Zoom-to-agent after AI Agents exist.
- District overview mode.
- Interior scene zoom presets.

These should call camera focus/zoom APIs rather than changing raw Phaser camera state directly.

## State Management

### Runtime Navigation State

Navigation state should be runtime-only for this feature. It does not need persistence, server state, or React state.

Recommended state:

```text
NavigationState
- cameraVelocity
- targetZoom
- currentIntent
- bounds
- isCityViewFocused
```

State should live near the Phaser scene because it changes every frame and is not needed by server-rendered UI.

### Config vs State

- Config: static values such as bounds, speed, zoom limits, smoothing, and key bindings.
- State: current velocity, current target zoom, current input intent, and focus state.

Keep config immutable during a scene session unless a later settings feature explicitly changes it.

### Future Shared State

Later systems may need world/entity state for Founder, Buildings, NPCs, AI Agents, and interiors. Do not store those future concepts inside navigation state. Instead:

- World/entity state should live in a game/domain layer.
- Navigation should consume optional camera targets or bounds from that layer.
- Entity systems should not import keyboard input handling.

## Extensibility Considerations

### Founder

Future Founder movement or follow-camera behavior should integrate through a camera target API. Founder controls should not be mixed into this feature's camera movement code.

Planned integration point:

```text
CameraTarget
- id
- position
- preferredZoom optional
- boundsMode optional
```

### Buildings

Buildings should become world entities or interactable objects later. For this feature, buildings remain visual landmarks only. Future building interactions should plug into a separate interaction layer that can request camera focus, hover states, or scene transitions without owning camera input.

### NPCs and AI Agents

NPCs and AI Agents should use future entity movement and animation systems. They can later request camera focus or appear within the navigable world, but their lifecycle and behavior must remain separate from navigation controls.

### Company Interiors

Company interiors should be modeled as separate world spaces with their own bounds, layers, and navigation config. The same navigation modules should support both exterior and interior scenes by accepting different bounds/config.

### Districts and Larger Worlds

District expansion should not require changing input or camera math. Larger maps should provide updated world bounds and layers. The camera controller should remain agnostic about what the map represents.

### Engine Direction

This feature should move toward the `PROJECT_BIBLE.md` Engine/Game/UI separation without prematurely creating a full engine framework:

- Engine-like: camera, input, geometry, scene lifecycle helpers.
- Game-like: city world config, city visual layers, district/building placement.
- UI-like: React shell, hints, future controls and inspectors.

## Validation Strategy

### Static Validation

- Run TypeScript validation with the existing project toolchain.
- Run production build to catch client/server boundary issues and Phaser import issues.

### Browser Validation

Manually verify:

- WASD moves the camera in all four directions.
- Arrow keys move the camera in all four directions.
- Diagonal movement is controlled and not faster than intended.
- Holding movement keys stays smooth and bounded.
- Opposite direction keys do not jitter.
- Arrow keys do not scroll the page while the city view is active.
- Zoom in and zoom out remain bounded and readable.
- Movement and zoom together do not cause disorienting jumps.
- The feature works without Founder, building interaction, NPCs, AI Agents, or AI integration.

### Acceptance Mapping

- FR-001 through FR-007: validated through movement scenarios and visual stability checks.
- FR-008 through FR-011: validated through zoom scenarios and bounds checks.
- FR-012: validated through focused keyboard navigation and page-scroll checks.
- FR-013 through FR-017: validated by code review and browser behavior confirming exclusions remain absent.
- FR-018: validated by module boundaries and config-driven navigation design.

## Implementation Boundaries

This plan intentionally does not authorize implementation yet. Implementation should wait for `tasks.md` generated by `/speckit-tasks`.

Allowed future implementation scope after tasks exist:

- Refactor existing city-view scene code into planned modules.
- Preserve or improve current visible city navigation behavior.
- Add focused configuration and navigation state types.
- Keep all work inside the city-view feature unless tasks justify a small shared helper.

Disallowed in this feature:

- Founder systems.
- Building interaction systems.
- NPC or AI Agent systems.
- Company interiors.
- AI integration or tool execution.
- Persistence, backend endpoints, or external service calls.

## Complexity Tracking

No constitution violations are planned. No additional framework, service, persistence layer, or full entity-component system is justified for this feature.
