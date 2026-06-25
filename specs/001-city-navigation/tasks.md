# Tasks: City Navigation

**Input**: Design documents from `specs/001-city-navigation/`

**Prerequisites**: `plan.md`, `spec.md`, `PROJECT_BIBLE.md`

**Tests**: No automated test framework is introduced by this task list. Validation uses TypeScript/build checks plus a manual test checklist.

**Organization**: Tasks are grouped by implementation phase and user story. Each task is small, ordered, and implementation-ready.

## Format

Each task uses this format:

```text
- [ ] T### [P?] [Story?] Description with file path
  - Files likely affected: path list
  - Acceptance criteria: concrete completion checks
```

## Phase 1: Setup and Scene Module Separation

**Purpose**: Create the modular file structure from `plan.md` before moving behavior into focused modules.

- [X] T001 Create city scene configuration modules in `src/features/city-view/scene/config/cityWorldConfig.ts` and `src/features/city-view/scene/config/navigationConfig.ts`
  - Files likely affected: `src/features/city-view/scene/config/cityWorldConfig.ts`, `src/features/city-view/scene/config/navigationConfig.ts`
  - Acceptance criteria: Exports world dimensions, movement speed, smoothing values, zoom limits, zoom speeds, and input binding names; no Phaser scene lifecycle code is placed in config files.

- [X] T002 Create shared scene type modules in `src/features/city-view/scene/shared/geometry.ts` and `src/features/city-view/scene/shared/phaserTypes.ts`
  - Files likely affected: `src/features/city-view/scene/shared/geometry.ts`, `src/features/city-view/scene/shared/phaserTypes.ts`
  - Acceptance criteria: Defines reusable world-space geometry types such as point and bounds; defines reusable Phaser runtime type aliases used by scene modules; no feature behavior is implemented in shared type files.

- [X] T003 Create world layer modules in `src/features/city-view/scene/layers/CityGroundLayer.ts`, `CityRoadLayer.ts`, `CityBuildingLayer.ts`, and `CityDecorationLayer.ts`
  - Files likely affected: `src/features/city-view/scene/layers/CityGroundLayer.ts`, `src/features/city-view/scene/layers/CityRoadLayer.ts`, `src/features/city-view/scene/layers/CityBuildingLayer.ts`, `src/features/city-view/scene/layers/CityDecorationLayer.ts`
  - Acceptance criteria: Each layer exposes a focused draw/create function; layer modules only create visual city content; no camera movement, input handling, Founder behavior, building entry, NPCs, AI agents, AI integration, or ECS implementation is added.

- [X] T004 Refactor exterior city scene composition into `src/features/city-view/scene/CityWorldScene.ts`
  - Files likely affected: `src/features/city-view/scene/CityWorldScene.ts`, `src/features/city-view/scene/createCityScene.ts`, layer modules from T003
  - Acceptance criteria: `CityWorldScene` owns Phaser `create` and `update` lifecycle composition; visual drawing is delegated to layer modules; `createCityScene.ts` remains a thin factory/export boundary; existing city visuals remain recognizable.

## Phase 2: Foundational Navigation Controllers

**Purpose**: Establish input, camera, and navigation state modules before implementing user-visible movement and zoom behavior.

- [X] T005 Create navigation type definitions in `src/features/city-view/scene/navigation/navigationTypes.ts`
  - Files likely affected: `src/features/city-view/scene/navigation/navigationTypes.ts`
  - Acceptance criteria: Defines `NavigationIntent`, `NavigationState`, optional camera target types, and config-facing type shapes; types are generic to navigation and do not reference Founder, Buildings, NPCs, AI Agents, company interiors, or AI integrations.

- [X] T006 Create runtime navigation state module in `src/features/city-view/scene/navigation/NavigationState.ts`
  - Files likely affected: `src/features/city-view/scene/navigation/NavigationState.ts`, `src/features/city-view/scene/navigation/navigationTypes.ts`
  - Acceptance criteria: Provides initialization for camera velocity, target zoom, current intent, bounds, and focus state; state is runtime-only and does not use React state, persistence, server calls, or external services.

- [X] T007 Create `NavigationInputController` skeleton in `src/features/city-view/scene/navigation/NavigationInputController.ts`
  - Files likely affected: `src/features/city-view/scene/navigation/NavigationInputController.ts`, `src/features/city-view/scene/navigation/navigationTypes.ts`, `src/features/city-view/scene/config/navigationConfig.ts`
  - Acceptance criteria: Exposes lifecycle methods for setup, reading current intent, and cleanup; does not directly modify Phaser camera scroll or zoom; returns a neutral intent when no input is active.

- [X] T008 Create `CameraController` skeleton in `src/features/city-view/scene/navigation/CameraController.ts`
  - Files likely affected: `src/features/city-view/scene/navigation/CameraController.ts`, `src/features/city-view/scene/navigation/navigationTypes.ts`, `src/features/city-view/scene/shared/geometry.ts`, `src/features/city-view/scene/config/navigationConfig.ts`
  - Acceptance criteria: Exposes methods for update, bounds assignment, target zoom assignment, optional world-point focus, and cleanup; accepts navigation intent instead of reading keyboard input directly.

- [X] T009 Wire `NavigationInputController`, `CameraController`, and `NavigationState` into `CityWorldScene`
  - Files likely affected: `src/features/city-view/scene/CityWorldScene.ts`, `src/features/city-view/scene/navigation/NavigationInputController.ts`, `src/features/city-view/scene/navigation/CameraController.ts`, `src/features/city-view/scene/navigation/NavigationState.ts`
  - Acceptance criteria: Scene initializes controllers during `create`, passes per-frame intent to camera update during `update`, and cleans up listeners on scene shutdown; scene remains free of inline camera/input algorithms beyond orchestration.

## Phase 3: User Story 1 - Move Through the City View (Priority: P1) MVP

**Goal**: Users can move the camera across the 2D top-down city view.

**Independent Test**: Open the city view and verify that directional keyboard input changes the visible city area without requiring Founder, building interaction, NPCs, or AI behavior.

- [X] T010 [US1] Implement WASD movement intent in `NavigationInputController`
  - Files likely affected: `src/features/city-view/scene/navigation/NavigationInputController.ts`, `src/features/city-view/scene/config/navigationConfig.ts`
  - Acceptance criteria: `W`, `A`, `S`, and `D` produce up, left, down, and right movement intent respectively; no camera movement is performed inside the input controller.

- [X] T011 [US1] Implement arrow-key movement intent in `NavigationInputController`
  - Files likely affected: `src/features/city-view/scene/navigation/NavigationInputController.ts`, `src/features/city-view/scene/config/navigationConfig.ts`
  - Acceptance criteria: Arrow up, left, down, and right produce the same directional intent as corresponding WASD keys; using either keyboard scheme produces equivalent movement intent.

- [X] T012 [US1] Capture movement keys while the city view is active to prevent page scrolling
  - Files likely affected: `src/features/city-view/scene/navigation/NavigationInputController.ts`, `src/features/city-view/CitySceneCanvas.tsx`
  - Acceptance criteria: WASD and arrow keys are captured for the active city canvas; arrow-key navigation does not scroll the page during focused city navigation; cleanup restores normal behavior when the Phaser game is destroyed.

- [X] T013 [US1] Implement camera movement update in `CameraController`
  - Files likely affected: `src/features/city-view/scene/navigation/CameraController.ts`, `src/features/city-view/scene/navigation/NavigationState.ts`
  - Acceptance criteria: Directional intent changes camera scroll in the expected direction; diagonal movement is normalized so diagonal speed does not exceed cardinal speed; camera movement is independent of world layer modules.

- [X] T014 [US1] Implement smooth camera acceleration and stopping in `CameraController`
  - Files likely affected: `src/features/city-view/scene/navigation/CameraController.ts`, `src/features/city-view/scene/config/navigationConfig.ts`, `src/features/city-view/scene/navigation/NavigationState.ts`
  - Acceptance criteria: Camera velocity interpolates toward target velocity using configured smoothing; held movement remains controlled over a 30-second session; releasing movement keys slows/stops without visible jitter.

- [X] T015 [US1] Implement predictable opposite-key conflict handling in movement intent
  - Files likely affected: `src/features/city-view/scene/navigation/NavigationInputController.ts`, `src/features/city-view/scene/navigation/navigationTypes.ts`
  - Acceptance criteria: Pressing opposite directions on the same axis does not create jitter; each axis resolves to zero or a documented deterministic result; combined non-conflicting axes still allow controlled diagonal movement.

**Checkpoint**: User Story 1 is independently testable: camera movement works with keyboard input and does not depend on excluded systems.

## Phase 4: User Story 2 - Use Either Common Keyboard Scheme (Priority: P2)

**Goal**: WASD and arrow keys both provide equivalent city navigation.

**Independent Test**: Navigate a comparable route using only WASD and then only arrow keys; verify the direction model and camera behavior match.

- [ ] T016 [US2] Centralize movement bindings in `navigationConfig.ts`
  - Files likely affected: `src/features/city-view/scene/config/navigationConfig.ts`, `src/features/city-view/scene/navigation/NavigationInputController.ts`
  - Acceptance criteria: WASD and arrow-key bindings are defined in configuration; changing a binding does not require changing camera movement code; both schemes remain enabled by default.

- [ ] T017 [US2] Verify and align WASD and arrow-key behavior through shared intent mapping
  - Files likely affected: `src/features/city-view/scene/navigation/NavigationInputController.ts`
  - Acceptance criteria: WASD and arrow keys feed the same `NavigationIntent` shape; alternating between input schemes requires no mode switch; simultaneous equivalent keys do not double movement speed.

## Phase 5: User Story 3 - Zoom the City View (Priority: P3)

**Goal**: Users can zoom in and out while the city remains readable, bounded, and navigable.

**Independent Test**: Zoom in and out from the city view and confirm the city remains readable, oriented around the current area of interest, and constrained to supported zoom levels.

- [ ] T018 [US3] Add zoom input intent to `NavigationInputController`
  - Files likely affected: `src/features/city-view/scene/navigation/NavigationInputController.ts`, `src/features/city-view/scene/config/navigationConfig.ts`
  - Acceptance criteria: Keyboard zoom controls and mouse wheel input produce zoom intent; wheel zoom applies only when interacting with the city canvas; input controller still does not mutate camera zoom directly.

- [ ] T019 [US3] Implement target zoom state and smooth zoom interpolation in `CameraController`
  - Files likely affected: `src/features/city-view/scene/navigation/CameraController.ts`, `src/features/city-view/scene/navigation/NavigationState.ts`, `src/features/city-view/scene/config/navigationConfig.ts`
  - Acceptance criteria: Zoom changes interpolate smoothly toward a target zoom; zooming preserves the user's current area of interest; movement remains usable during and after zoom changes.

- [ ] T020 [US3] Enforce configured minimum and maximum zoom limits
  - Files likely affected: `src/features/city-view/scene/navigation/CameraController.ts`, `src/features/city-view/scene/config/navigationConfig.ts`
  - Acceptance criteria: Repeated zoom-in attempts stop at configured max zoom; repeated zoom-out attempts stop at configured min zoom; no broken visual state appears at either limit.

- [ ] T021 [US3] Re-clamp camera scroll after zoom changes
  - Files likely affected: `src/features/city-view/scene/navigation/CameraController.ts`, `src/features/city-view/scene/shared/geometry.ts`
  - Acceptance criteria: Zooming near world edges does not expose unintended blank or broken space; camera bounds remain valid after visible world size changes.

## Phase 6: User Story 4 - Support Future Navigation Growth (Priority: P4)

**Goal**: Keep navigation modular so future Founder, Buildings, NPCs, AI Agents, and Company Interiors can plug in without major refactoring.

**Independent Test**: Review module boundaries and confirm navigation is camera/view control only, with no excluded future systems implemented.

- [ ] T022 [US4] Add camera target and focus extension types without implementing future entities
  - Files likely affected: `src/features/city-view/scene/navigation/navigationTypes.ts`, `src/features/city-view/scene/navigation/CameraController.ts`
  - Acceptance criteria: Defines generic camera target/focus input types for future use; no Founder, Building, NPC, AI Agent, interior, AI integration, or ECS behavior is implemented.

- [ ] T023 [US4] Keep building visuals non-interactive during layer separation
  - Files likely affected: `src/features/city-view/scene/layers/CityBuildingLayer.ts`, `src/features/city-view/scene/CityWorldScene.ts`
  - Acceptance criteria: Buildings remain visual landmarks only; no click handlers, hover inspection, entry transitions, selection state, or building data model is added.

- [ ] T024 [US4] Document scene extension boundaries in `src/features/city-view/scene/CityWorldScene.ts`
  - Files likely affected: `src/features/city-view/scene/CityWorldScene.ts`
  - Acceptance criteria: A brief code comment identifies where future layers/controllers can be composed; comment is limited to extension guidance and does not describe unimplemented behavior as present.

## Phase 7: UI Navigation Hints

**Purpose**: Keep the visible city controls aligned with the implemented navigation behavior.

- [ ] T025 Update navigation hints in `src/features/city-view/CityView.tsx`
  - Files likely affected: `src/features/city-view/CityView.tsx`
  - Acceptance criteria: UI hint text accurately lists movement and zoom controls; hint remains concise and does not describe Founder, building entry, NPC, AI Agent, AI integration, or future-only controls.

- [ ] T026 Verify city canvas accessibility label remains accurate in `src/features/city-view/CitySceneCanvas.tsx`
  - Files likely affected: `src/features/city-view/CitySceneCanvas.tsx`
  - Acceptance criteria: Accessible label describes the top-down city view without implying interactive building entry, NPCs, Founder controls, or AI activity; label remains suitable for a visual canvas.

## Phase 8: Validation and Manual Test Checklist

**Purpose**: Confirm the feature satisfies the specification and does not add excluded systems.

- [ ] T027 Run TypeScript validation with `npx tsc --noEmit`
  - Files likely affected: `package.json`, `tsconfig.json`, files under `src/features/city-view/scene/`
  - Acceptance criteria: TypeScript validation completes with no type errors introduced by this feature.

- [ ] T028 Run production build with `npm run build`
  - Files likely affected: `package.json`, `src/app/`, `src/features/city-view/`
  - Acceptance criteria: Production build completes; client-only Phaser import boundaries remain valid.

- [ ] T029 Create manual navigation test checklist in `specs/001-city-navigation/checklists/manual-test.md`
  - Files likely affected: `specs/001-city-navigation/checklists/manual-test.md`
  - Acceptance criteria: Checklist covers WASD, arrow keys, diagonal movement, opposite-key behavior, smooth held movement, camera bounds, zoom in, zoom out, zoom limits, movement while zooming, page-scroll prevention, and explicit absence of Founder/building entry/NPC/AI integration.

- [ ] T030 Complete manual browser validation against `specs/001-city-navigation/checklists/manual-test.md`
  - Files likely affected: `specs/001-city-navigation/checklists/manual-test.md`
  - Acceptance criteria: Each manual checklist item is marked pass/fail with notes; failures are either fixed before completion or documented as blockers; validation confirms no Founder, building entry, NPCs, AI integration, or ECS implementation was added.

## Dependencies & Execution Order

### Phase Dependencies

- Phase 1 must complete before Phase 2 because controllers depend on module paths and config/types.
- Phase 2 must complete before movement or zoom user stories because input, camera, and state modules are the foundation.
- User Story 1 should complete before User Story 2 because shared movement behavior must exist before parity between input schemes is validated.
- User Story 3 can start after Phase 2, but should integrate after movement is stable to validate movement and zoom together.
- User Story 4 should run after core navigation modules exist, so extension points reflect real boundaries.
- UI hints should update after final control bindings are confirmed.
- Validation runs last.

### User Story Dependencies

- **US1 Move Through the City View**: Depends on Phase 1 and Phase 2.
- **US2 Use Either Common Keyboard Scheme**: Depends on US1 movement intent and camera behavior.
- **US3 Zoom the City View**: Depends on Phase 2 and should be validated with US1 movement.
- **US4 Support Future Navigation Growth**: Depends on Phase 1 and Phase 2 module boundaries.

## Parallel Opportunities

- T001 and T002 can run in parallel because config and shared type modules are separate.
- T003 layer files can be split across multiple implementers if they coordinate exported function names before T004.
- T005 and T006 can run close together, but T006 should align with types from T005.
- T016 can proceed while zoom tasks T018-T021 proceed after T010-T015 establish movement behavior.
- T025 and T026 can run in parallel after control bindings are finalized.
- T027 and T028 must run after implementation tasks, while T029 can be drafted before final browser validation.

## Implementation Strategy

### MVP First

1. Complete Phase 1 scene module separation.
2. Complete Phase 2 navigation foundations.
3. Complete Phase 3 movement behavior.
4. Stop and validate that US1 works independently.

### Incremental Delivery

1. Deliver basic movement with modular scene/controller boundaries.
2. Add input-scheme parity for WASD and arrow keys.
3. Add zoom controls and zoom limits.
4. Add future extension points without implementing future systems.
5. Update hints and run full validation.

### Explicit Non-Goals

Do not add:

- Founder behavior or controls.
- Building entry, building selection, building inspection, or building interaction.
- NPCs, agent characters, autonomous movement, or character interaction.
- AI integration, task execution, tool activity, external services, or backend endpoints.
- Full ECS implementation or broad engine extraction.

## Task Count Summary

- Total tasks: 30
- Setup and module separation: 4
- Foundational navigation controllers: 5
- US1 movement: 6
- US2 keyboard parity: 2
- US3 zoom: 4
- US4 extensibility: 3
- UI hints: 2
- Validation/manual checklist: 4