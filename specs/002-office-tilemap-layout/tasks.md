# Tasks: Office Tilemap Layout

**Input**: Design documents from `/specs/002-office-tilemap-layout/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Automated validation is required after implementation; no separate test files are required for this phase.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add static layout assets and update office type/config surface.

- [x] T001 Create office asset files in public/assets/office/daily-proof/
- [x] T002 Update OfficeDefinition tilemap metadata in src/features/city-view/scene/office/officeTypes.ts and src/features/city-view/scene/office/officeConfig.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Load tilemap layers, markers, and collision before replacing movement.

- [x] T003 Add OfficeTilemapLayer in src/features/city-view/scene/office/OfficeTilemapLayer.ts
- [x] T004 Add OfficeCollisionMap in src/features/city-view/scene/office/OfficeCollisionMap.ts
- [x] T005 Add tile-based MovementResolver in src/features/city-view/scene/office/OfficeTileMovementResolver.ts

---

## Phase 3: User Story 1 - Enter A Real Office Interior (Priority: P1) MVP

**Goal**: Render the office from tilemap assets while preserving existing transition, camera, input, and exit behavior.

**Independent Test**: Enter Daily Proof from the city and confirm the office tilemap renders and exits back to the city.

- [x] T006 [US1] Integrate tilemap preload/create flow in src/features/city-view/scene/office/CompanyOfficeScene.ts
- [x] T007 [US1] Reduce OfficeVisualLayer to title/debug overlays in src/features/city-view/scene/office/OfficeVisualLayer.ts

---

## Phase 4: User Story 2 - Respect Interior Obstacles (Priority: P2)

**Goal**: Use tile collision for founder movement.

**Independent Test**: Founder is blocked by collision tiles and can move over empty floor tiles.

- [x] T008 [US2] Replace OfficeBoundsMovementResolver usage with OfficeTileMovementResolver in src/features/city-view/scene/office/CompanyOfficeScene.ts
- [x] T009 [US2] Validate founder spawn and exit center against collision in src/features/city-view/scene/office/CompanyOfficeScene.ts

---

## Phase 5: User Story 3 - Reserve Semantic Layout Anchors (Priority: P3)

**Goal**: Keep named object markers and an interaction layer available for future systems without implementing gameplay.

**Independent Test**: Required markers and the reserved interaction layer exist in the tilemap asset and load without creating gameplay objects.

- [x] T010 [US3] Validate object markers and reserved interaction layer in src/features/city-view/scene/office/OfficeTilemapLayer.ts

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validate and clean up.

- [x] T011 Run npx tsc --noEmit
- [x] T012 Run npm run build
- [x] T013 Run git diff --check

---

## Dependencies & Execution Order

- Phase 1 before Phase 2.
- Phase 2 before user stories.
- US1 before US2 because movement depends on loaded tilemap collision.
- US3 can complete after tilemap loading exists.
- Validation after implementation.

## Implementation Strategy

1. Add static office tilemap assets.
2. Add office tilemap loading, collision, and movement utilities.
3. Integrate them into CompanyOfficeScene.
4. Preserve existing transition and controller behavior.
5. Run automated validation.
