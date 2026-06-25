# Architecture Review 001: City Navigation

**Feature**: `001-city-navigation`

**Review date**: 2026-06-25

**Scope**: Architecture freeze review before implementation. This review does not authorize implementation, add tasks, or modify application code.

## Board Position

The proposed architecture is directionally correct for feature 001, but it should be treated as the first slice of a long-lived world platform, not as a final engine shape. The plan is strongest where it separates input, camera, scene composition, state, and visual layers. It is weakest where long-term world hierarchy and entity identity remain informal.

The board approves implementation of the feature after this review, with one important caveat: future work must not let `CameraController`, `NavigationState`, or layer modules become dumping grounds for world simulation behavior.

## Strengths

- The feature honors the Project Bible by making AI City navigable as a place rather than a dashboard.
- The scope excludes Founder, building interaction, NPCs, AI Agents, and AI integration, which keeps the first slice disciplined.
- `CameraController` and `NavigationInputController` create a clean separation between input intent and camera behavior.
- Runtime-only navigation state is appropriate for high-frequency camera data.
- World layers are separated from camera and input responsibilities.
- The task list includes acceptance criteria and explicit non-goals, which is useful for AI-assisted implementation control.
- The plan avoids premature ECS and broad engine extraction.

## Weaknesses

- `CameraController` is an undersized name for the long-term camera needs of AI City. The project will eventually need camera modes, camera targets, scripted motion, cinematic rails, follow behavior, transitions, and cutscene coordination.
- `NavigationState` is local and practical now, but the project lacks a formal `WorldState` boundary. That will become a problem as soon as Founder, Buildings, NPCs, schedules, or AI Agents need shared facts.
- The proposed hierarchy includes `Map`, but `Map` is a technical/content concept, not a strong product concept. `WorldSpace` or scene/map data should support Districts and interiors rather than sit as a top-level domain parent.
- Buildings are still described mostly as layer visuals. If this continues too long, building identity, ownership, interiors, and company relationships will be bolted on later.
- The tasks create many module files before behavior. That is acceptable for this first architecture slice, but it risks empty abstraction if the implementation does not immediately integrate them.
- Folder-level documentation is not yet planned as a first-class architecture control, even though this repository is explicitly preparing for long-term AI-assisted development.

## Risks

### Risk 1: Camera Logic Becomes a Monolith

If `CameraController` accumulates manual movement, follow behavior, cutscenes, transitions, shake, zoom presets, and AI-event framing, it will become hard to reason about.

**Recommendation**: Keep `CameraController` as the manual camera behavior driver. Migrate to a `CameraRig` abstraction when the second camera mode appears.

### Risk 2: World Concepts Remain Render-Only

If buildings, districts, roads, and landmarks exist only inside drawing functions, future features will have to reverse-engineer identity from pixels.

**Recommendation**: Promote world objects to data definitions before adding interaction. Presentation can remain the only active responsibility at first.

### Risk 3: UI Reclaims Product Ownership

Navigation hints and panels are useful, but the product can drift into dashboard mode if workflows are primarily expressed through UI panels.

**Recommendation**: Require every future feature to define the in-world representation first, then supporting UI second.

### Risk 4: AI Integrations Arrive Too Early

GitHub, Codex, Firebase, and Figma integrations will be tempting, but without visible rituals they will create status panels rather than believable world activity.

**Recommendation**: Defer real tool integrations until agents, tasks, evidence, approval, and work locations exist.

### Risk 5: Scene Boundaries Blur

Exterior world, building interiors, overlays, and future cutscenes have different lifecycle needs. A single scene can become overloaded.

**Recommendation**: Treat interiors as separate world spaces or scenes. Share navigation modules through config rather than coupling interiors into the exterior scene.

## Review Topic Findings

### 1. Camera Architecture

`CameraController` is acceptable now. It should eventually evolve toward a `CameraRig` capable of manual mode, Founder follow, entity focus, building transitions, scripted events, and cinematics.

Do not rename it today. The migration path should be:

1. Keep `CameraController` focused on manual camera input, bounds, smoothing, and zoom.
2. Add generic camera target types now or soon.
3. When another camera behavior appears, introduce `CameraRig` as the owner of camera modes.
4. Move `CameraController` under the rig as the `manual` driver.

### 2. Navigation State

`NavigationState` should remain local now. It should not become global just because a future `WorldState` will exist.

Benefits of eventual `WorldState`:

- Shared world facts across scenes, entities, UI, and integrations.
- Durable identity for districts, companies, buildings, floors, departments, agents, and tasks.
- Cleaner event flow for schedules, AI actions, approvals, and visual state.

Drawbacks:

- Premature global state can become a dumping ground.
- Frame-level camera values do not belong in durable state by default.
- It can couple React, Phaser, and domain logic if introduced without strict boundaries.

Migration strategy:

- Keep transient camera velocity and intent local.
- Move world bounds, scene identity, landmarks, and entity targets into `WorldState` when multiple systems need them.
- Let navigation read world-provided camera targets rather than owning world facts.

### 3. World Hierarchy

Recommended hierarchy:

```text
World
-> WorldSpace
-> District
-> Company
-> Building
-> Floor
-> Department
-> Entity
```

`Task` should not be a child under `Entity`. A task is a domain/work object that references entities, locations, agents, artifacts, approvals, and events. It may have in-world representations such as task boards, markers, envelopes, or workstation queues.

`Map` should be treated as a technical/content artifact under `WorldSpace`, District, Building, or Floor. It is not the durable product hierarchy.

### 4. Building Representation

Buildings should already be considered future World Entities with presentation-only responsibility today.

Advantages:

- Early identity and ownership model.
- Cleaner migration to building entry, interiors, company creation, expansion, and state.
- Better compatibility with camera targeting and world events.

Disadvantages:

- Risk of over-modeling before interaction exists.
- More naming and data decisions up front.
- Potential temptation to implement building interactions before the spec allows them.

Recommendation: Treat building data as future entity definitions, but keep `001-city-navigation` implementation presentational only.

### 5. Entity Direction

The current architecture is compatible with a future shared Entity model if discipline is maintained. Layers can later render entity presenters, and navigation can focus entity targets. It is not compatible if layer modules become the only place where object identity exists.

Do not introduce ECS now. A lightweight entity vocabulary is enough until composition pressure proves otherwise.

### 6. Documentation Strategy

Important folders should contain README.md files once they exist with multiple modules:

- `scene/`: scene lifecycle and composition boundary.
- `scene/navigation/`: input, camera, state, and future camera target rules.
- `scene/layers/`: presentational layer contract and behavior prohibitions.
- Future `world/`: world hierarchy and durable world facts.
- Future `entities/`: identity, position, presentation, state, ownership, and capabilities.
- Future `integrations/`: external tool boundaries and evidence requirements.

This matters because AI-assisted development needs local guardrails. Top-level docs are useful, but folder-level architecture notes reduce drift at the edit site.

### 7. Task Granularity

The task breakdown is appropriate for controlled AI implementation. It is small, ordered, and has acceptance criteria.

Concern: setup tasks may create abstractions before the implementation proves them. That is acceptable here because the plan is explicitly about module separation, but future task lists should avoid file-creation work that is not immediately integrated.

Future task sizing guideline:

- One task should produce a reviewable behavior, boundary, or validation result.
- Avoid tasks larger than one conceptual responsibility.
- Avoid tasks so small that they create unintegrated empty files.
- Every task should name files, acceptance criteria, and exclusions where relevant.

### 8. Technical Debt Prediction

Likely six-month debt areas:

- Camera logic accumulating unrelated modes.
- World objects existing only as drawing instructions.
- Building identity added too late.
- Scene files mixing rendering, input, simulation, and UI events.
- AI integration state bypassing world events.
- React UI panels becoming the real product model.
- Lack of folder-level architecture docs causing AI-generated drift.
- Manual validation not becoming automated where repeatable.

Preventative decisions:

- Create camera mode boundaries before the second camera behavior lands.
- Introduce world-space and entity definitions before building interaction.
- Keep task and AI integration events out of Phaser scene internals.
- Add folder READMEs when module folders are created.
- Add browser-level regression tests once navigation behavior stabilizes.

### 9. Future Compatibility Score

**Score: 7/10**

Compatibility by system:

| Future system | Compatibility | Notes |
| --- | --- | --- |
| Founder | 7 | Camera target path exists conceptually, but no actor/world state yet. |
| Company Creation | 6 | Buildings and companies need identity/data definitions before this is strong. |
| Building Entry | 7 | Plan correctly separates interiors as future spaces, but no transition model yet. |
| NPCs | 7 | Navigation is decoupled, but entity movement systems are not formalized. |
| Schedules | 5 | No time/world event model yet. |
| AI Agents | 7 | Good non-coupling, but visual work rituals need future systems. |
| GitHub | 6 | Must wait for tasks/evidence/approval/world events. |
| Codex | 6 | Same as GitHub; visual representation must precede integration. |
| Vehicles | 6 | Needs pathing, entity movement, and traffic/world rules. |
| Weather | 7 | Layer separation helps, but world environment state is absent. |
| Day/Night | 7 | Layer/scene config helps, but time state is absent. |
| Cutscenes | 5 | Requires CameraRig/cinematic mode not currently planned. |
| Camera Follow | 7 | Focus target concept helps, but not yet a rig. |
| Building Expansion | 6 | Needs building entity identity and company ownership. |

The architecture is good enough for feature 001. It is not yet a full platform architecture.

### 10. Challenge The Architecture

The weakest current decision is treating `CameraController` as the center of future camera extensibility. That is fine for manual navigation but insufficient for a multi-year world simulation. The better long-term model is `CameraRig` with modes and drivers.

Trade-off:

- Keeping `CameraController` now is simpler and correct for feature 001.
- Introducing `CameraRig` now would be premature and likely speculative.
- The right compromise is to keep `CameraController`, but prevent direct Phaser camera mutation outside it and keep its API migration-friendly.

The second weak point is the lack of formal world object identity. Presentation layers are useful, but AI City will fail architecturally if buildings, trees, workstations, roads, and task markers remain anonymous drawing commands. The project should promote world definitions soon, but not in this feature.

## Recommended Architecture Changes

These are recommendations for future planning, not new tasks for feature 001:

1. Introduce `CameraRig` when the second camera behavior appears.
2. Replace product-level `Map` thinking with `WorldSpace` plus technical map data.
3. Treat Buildings as future World Entities even while presentation-only.
4. Add folder READMEs when `scene/`, `navigation/`, and `layers/` become real multi-file folders.
5. Introduce world/entity definitions before building interaction or company creation.
6. Keep AI integrations blocked until visible rituals, tasks, agents, evidence, and approval exist.

## Decisions To Approve Now

- Navigation remains camera/view control only.
- `CameraController` is acceptable for feature 001.
- `NavigationInputController` is the right boundary for raw input.
- `NavigationState` remains runtime-local.
- Scene layers remain presentational.
- No ECS implementation.
- No global engine extraction.
- No Founder, building entry, NPC, AI Agent, or AI integration in feature 001.

## Decisions Intentionally Postponed

- `CameraRig` implementation.
- Global `WorldState` implementation.
- Building entity data model.
- Entity registry or component model.
- Interior scene transition model.
- Schedules, weather, day/night, and cutscene systems.
- GitHub, Codex, Firebase, Figma, and other tool integrations.
- Automated browser regression test framework.

## Final Board Recommendation

Proceed to implementation only after this architecture freeze is accepted. The feature is architecturally viable, but the next major feature after navigation should not be another isolated visual layer. It should start formalizing world identity: either WorldSpace/District definitions, Building entity definitions, or Founder as a world entity. Without that, the project will drift toward a decorated scene instead of a living city platform.
