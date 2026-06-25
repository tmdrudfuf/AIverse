# AI City Architecture Decisions

This log records decisions from Architecture Board Review 001 for feature `001-city-navigation`. It is a durable architecture record, not an implementation task list.

## ADR-001: Treat Navigation as View Control, Not Entity Interaction

**Decision**: Keep `001-city-navigation` scoped to camera/view control. Do not mix Founder movement, building interaction, NPC behavior, or AI activity into navigation.

**Status**: Approved

**Reasoning**: The first city feature must establish that AI City is a navigable world. Navigation should make the world inspectable without implying that world entities already exist as interactive systems. This preserves the feature's explicit exclusions and prevents premature coupling between input, camera, and future entity logic.

**Alternatives**: Couple keyboard input directly to a Founder avatar; make buildings clickable immediately; use navigation as a generic interaction manager.

**Expected impact**: Camera and input systems remain stable when Founder, Buildings, NPCs, AI Agents, and interiors arrive. Implementation stays focused and testable.

**Migration notes**: Future entity systems may request camera focus through explicit camera target APIs, but they should not read raw keyboard input or mutate camera scroll directly.

## ADR-002: Start with CameraController, Migrate Toward CameraRig

**Decision**: Use `CameraController` for the first navigation implementation, but design its public surface so it can later evolve into or sit behind a richer `CameraRig`.

**Status**: Future

**Reasoning**: A simple controller is appropriate for movement, bounds, smoothing, and zoom. Long term, AI City will need camera follow, building transitions, cinematics, scripted events, focus targets, district overview shots, and cutscenes. Those responsibilities are broader than a controller that only applies navigation intent.

**Alternatives**: Build a full camera rig now; keep all camera behavior inside the Phaser scene; let every future system manipulate the Phaser camera directly.

**Expected impact**: The first implementation stays small while keeping a clear migration path for advanced camera behavior.

**Migration notes**: Preserve methods such as `focusWorldPoint`, `setBounds`, and `setZoomTarget`. When cinematic or follow behavior appears, introduce `CameraRig` as an orchestrator that owns modes such as `manual`, `follow`, `transition`, `cinematic`, and `scripted`. Existing `CameraController` can become the manual-control driver inside the rig.

## ADR-003: Keep NavigationState Runtime-Local for Now

**Decision**: Keep `NavigationState` local to the active scene for `001-city-navigation`.

**Status**: Approved

**Reasoning**: Camera velocity, target zoom, current input intent, and focus state update every frame. Persisting or globalizing that state now would add complexity without product value.

**Alternatives**: Store navigation state in React state; persist camera state; include navigation inside a global world store immediately.

**Expected impact**: Implementation remains performant and isolated. React and server boundaries stay clean.

**Migration notes**: Separate transient camera state from durable world state. Later, a larger `WorldState` should own world identity, districts, companies, buildings, entities, schedules, events, and possibly current scene context. Navigation can read world bounds and camera targets from `WorldState`, but frame-by-frame velocity should remain local unless replay, persistence, or multiplayer requires otherwise.

## ADR-004: Prepare for WorldState, But Do Not Create It Yet

**Decision**: Do not introduce a full `WorldState` in `001-city-navigation`, but design config and types so navigation can later consume world-provided bounds, targets, and scene metadata.

**Status**: Deferred

**Reasoning**: AI City will need a shared state model for districts, companies, buildings, floors, departments, entities, tasks, schedules, and event history. However, the current feature has no durable world data beyond viewport bounds.

**Alternatives**: Create a comprehensive world store now; leave all future world state implicit inside Phaser scenes.

**Expected impact**: Avoids premature infrastructure while preventing hard-coded navigation assumptions from becoming a blocker.

**Migration notes**: Introduce `WorldState` when at least two systems need shared world facts, such as building entities plus Founder or AI Agent location. Migrate static world dimensions and landmark metadata out of navigation config into world definitions at that point.

## ADR-005: Use World > District > Company > Building > Floor > Department > Entity as the Primary Hierarchy

**Decision**: Prefer a hierarchy of `World -> District -> Company -> Building -> Floor -> Department -> Entity`, with technical `Map` or `WorldSpace` data supporting navigable areas, and with `Task` modeled as a domain object that can be represented by one or more entities or markers.

**Status**: Approved

**Reasoning**: The proposed hierarchy includes `Map`, but `Map` is ambiguous. It may mean renderable tile map, navigable space, data file, or geographic area. AI City's durable product hierarchy should express world concepts first. Technical map data should support a world space rather than sit as a product-level parent over districts.

**Alternatives**: `World -> Map -> District -> ...`; `World -> Scene -> Map -> Entity`; flat entity registry with tags only.

**Expected impact**: Product concepts remain stable while implementation can still use maps, tile layers, scenes, or spatial indexes internally.

**Migration notes**: Treat `Map` or `WorldSpace` as an implementation/data concept under a District, Building, Floor, or scene definition. Tasks should not be children of entities by default; they should reference entities, locations, agents, and artifacts.

## ADR-006: Treat Buildings as Future World Entities, Presentation-Only Today

**Decision**: Buildings should be considered future World Entities whose current responsibility is presentation only.

**Status**: Future

**Reasoning**: Buildings are central to AI City's world model. They need identity, ownership, location, visual presentation, future interactions, interiors, company association, expansion, and state. Treating them as mere drawing code for too long will create expensive rework.

**Alternatives**: Keep buildings as static layer drawing forever; implement full building interaction now; create a building domain model before it is used.

**Expected impact**: The first implementation can keep buildings non-interactive while naming and module boundaries anticipate entity promotion.

**Migration notes**: For `001-city-navigation`, keep `CityBuildingLayer` presentational. Later introduce building definitions with `id`, `type`, `position`, `bounds`, `companyId`, `visualVariant`, and `interiorSceneId`. Do not add entry or selection behavior until a feature requires it.

## ADR-007: Move Toward Entities Without Introducing ECS

**Decision**: The architecture should converge toward a shared Entity vocabulary without introducing a full entity-component-system yet.

**Status**: Approved

**Reasoning**: Founder, Buildings, Engineers, Trees, Vehicles, Coffee Shops, Drones, and Task Markers all need identity, position, state, presentation, ownership, capabilities, and sometimes interaction. A shared vocabulary will reduce one-off logic. A full ECS would be premature and could slow product learning.

**Alternatives**: Full ECS now; no entity abstraction; separate bespoke models for every object type.

**Expected impact**: Future systems can align around common concepts while early features remain understandable.

**Migration notes**: Start with light interfaces and registries when repeated behavior appears. Promote to ECS only if composition, high entity count, or systemic simulation complexity makes it clearly valuable.

## ADR-008: Keep Scene Layers Presentational and Deterministic

**Decision**: Scene layer modules should create visual city content in deterministic order and should not own camera, input, AI, or interaction behavior.

**Status**: Approved

**Reasoning**: Layers are useful for separating drawing concerns, but they can become hidden game systems if allowed to accumulate behavior. AI City needs clear boundaries between render composition and domain simulation.

**Alternatives**: Put all drawing in `CityWorldScene`; let each layer register input handlers and state; combine all world data and rendering in one module.

**Expected impact**: Easier refactoring when entity, interaction, interior, weather, and day/night layers are introduced.

**Migration notes**: When layers need behavior, introduce explicit systems or entity presenters rather than adding ad hoc logic to layer creation functions.

## ADR-009: Add README.md Files to Architecture-Bearing Folders

**Decision**: Important folders should eventually contain concise `README.md` files explaining architectural responsibilities and boundaries.

**Status**: Future

**Reasoning**: AI-assisted development increases the risk of local pattern drift. Folder-level READMEs provide durable guidance close to the code for `scene/`, `navigation/`, `layers/`, future `entities/`, future `world/`, future `interactions/`, and future `integrations/`.

**Alternatives**: Keep all architecture guidance in top-level docs only; rely on comments; rely on code structure alone.

**Expected impact**: Better consistency across future Codex sessions and contributors. Lower chance that navigation, rendering, AI, and domain responsibilities blur.

**Migration notes**: Add READMEs when those folders are created or when a folder gains multiple modules. Keep them short and boundary-focused, not tutorials.

## ADR-010: Task Granularity Is Acceptable but Slightly Front-Loaded

**Decision**: The current 30-task breakdown is acceptable for AI-assisted execution, though setup/module tasks should be watched for over-fragmentation.

**Status**: Approved

**Reasoning**: Tasks are small, ordered, and include acceptance criteria. This is good for controlled AI implementation. The risk is that creating many empty structure files before behavior can lead to architecture theater if not followed quickly by integration.

**Alternatives**: Merge setup tasks into fewer larger tasks; make every file a separate task; implement behavior before structure.

**Expected impact**: Provides strong control over the first architecture slice while preserving review checkpoints.

**Migration notes**: Future tasks should target independently verifiable behavior or meaningful boundaries. Avoid creating files that have no near-term integration path.

## ADR-011: Avoid Global Engine Extraction in Feature 001

**Decision**: Do not extract a global engine package or broad `src/engine` architecture during `001-city-navigation`.

**Status**: Approved

**Reasoning**: The project needs engine-like boundaries, but one navigation feature is not enough evidence for a durable engine API. Premature extraction would freeze assumptions before Founder, entities, interiors, and tool events exist.

**Alternatives**: Create full Engine/Game/UI folders now; keep everything inside one scene forever.

**Expected impact**: Reduces premature abstraction while preserving directional alignment with the Project Bible.

**Migration notes**: Extract engine modules only after two or more feature areas need the same concepts, such as exterior and interior scenes sharing camera, input, timing, or entity presentation.

## ADR-012: Introduce Scene/World Definitions Before Multiple Districts

**Decision**: Before adding multiple districts or interiors, introduce data definitions for world spaces rather than hard-coding bounds and landmarks in scene code.

**Status**: Future

**Reasoning**: Multiple districts, interiors, weather, schedules, and cutscenes will require consistent metadata: bounds, spawn points, camera defaults, layers, landmark IDs, and transitions.

**Alternatives**: Create each district as a separate hand-coded scene; use one giant scene with conditional drawing; introduce a full map editor pipeline immediately.

**Expected impact**: Smooth path from one city scene to multiple world spaces without large rewrites.

**Migration notes**: Begin with plain TypeScript world-space definitions. Consider external map tooling only when art/content scale demands it.

## ADR-013: Keep UI Hints Secondary to World Design

**Decision**: UI navigation hints are allowed, but they must support the world experience rather than becoming the primary interface model.

**Status**: Approved

**Reasoning**: The project principle is World First. Controls and overlays are necessary, but navigation should be understandable through spatial movement and visual response, not through dashboard-like panels.

**Alternatives**: Build a full tutorial overlay; hide controls entirely; centralize navigation in UI buttons.

**Expected impact**: Keeps first feature accessible without compromising the world-first product stance.

**Migration notes**: Future onboarding should prefer in-world affordances, signs, camera framing, and guided movement before heavy UI overlays.

## ADR-014: Defer AI Integration Until Visual Rituals Exist

**Decision**: Do not integrate GitHub, Codex, Firebase, Figma, or other tools until the world has places, agents, and visible action rituals that can represent tool activity.

**Status**: Deferred

**Reasoning**: Connecting tools before the city can show their work would create a dashboard in disguise. Real integrations must map to visible world behavior with Founder approval.

**Alternatives**: Add tool status panels early; integrate APIs first and visualize later; simulate tool activity without evidence.

**Expected impact**: Protects the product from becoming a conventional dashboard and preserves trust in visual state.

**Migration notes**: Build integrations only after Tasks, Agents, Workstations/Rooms, Approval, and Evidence concepts exist at least minimally.

## ADR-015: Compatibility Score for Current Architecture Is 7/10

**Decision**: Rate the current feature architecture as 7/10 for future compatibility.

**Status**: Approved

**Reasoning**: The design separates camera, input, state, and layers, and it avoids excluded systems. That is strong. It is not higher because WorldState, entity identity, scene transitions, and a real world hierarchy remain conceptual rather than formalized.

**Alternatives**: Score 5/10 due to missing world model; score 9/10 due to good modularity.

**Expected impact**: The architecture is fit to implement feature 001, but the next several features must formalize world/entity concepts quickly.

**Migration notes**: Reassess after the first feature that introduces either Founder, building entry, or persistent world entities.
