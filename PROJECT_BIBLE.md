# AI City Project Bible

AI City is a living world where AI companies operate visually.

This document defines the long-term vision, architecture, development philosophy, and rules for the project. It is not a README, implementation checklist, or marketing document. It is the constitution of AI City: the reference point for what belongs in the project, how systems should be shaped, and how future decisions should be judged.

## 1. Vision

AI City is a believable digital city where AI companies exist as places, AI agents work as employees, and real software actions are expressed through visible world behavior.

The purpose is not to create a dashboard.

The purpose is to create a world.

Dashboards summarize activity from outside the system. AI City should make activity observable from inside the system. A founder should not merely read that an AI engineer is working on a pull request. They should see the engineer enter the company building, walk to a workstation, begin work, communicate with teammates, wait for review, and complete the task.

The city is the interface. Buildings, rooms, tools, employees, vehicles, signs, notifications, and rituals are not decorative layers over data. They are the primary language of the product.

AI City should feel like a living operating environment for AI work:

- Companies have physical presence.
- Agents have location, role, activity, and state.
- Tasks create visible motion and consequence.
- Tools become places, machines, terminals, rooms, or services.
- The founder remains the final authority over consequential action.

The long-term goal is an AI operating system expressed as a city-scale simulation.

## 2. Core Philosophy

### World First

Every feature should begin with the question: how does this exist inside the world?

AI City should not treat the world as a skin over conventional software. The world is the product model. Features should be designed as places, objects, characters, actions, relationships, and visible state changes before they become panels, forms, or API calls.

### AI Never Teleports

AI agents should not appear, disappear, or complete work without spatial continuity.

If an agent moves from one task to another, the world should communicate that transition. If an engineer needs to use a tool, they should move toward the relevant station, room, building, or interface. Movement is not filler. Movement creates believability, sequencing, anticipation, and accountability.

### Every AI Action Is Visible

AI work must have a visual counterpart.

Thinking, coding, reviewing, designing, committing, deploying, researching, and asking for approval should all produce readable world behavior. The user should be able to understand what is happening by watching the city, not only by reading logs.

### Founder Always Has Final Approval

The founder is the ultimate decision-maker.

AI agents may propose, prepare, simulate, draft, and recommend. They may execute low-risk delegated tasks when rules allow it. But important actions must surface for founder approval before they become irreversible or externally consequential.

The city should make this authority visible. Approval should feel like a world event, not a hidden confirmation dialog.

### Real AI Actions Should Map To Visual Actions

When real tools are integrated, their operations should be represented as believable world activity.

For example, a GitHub commit should not merely update a status label. It should correspond to an engineer working at a computer, producing a change, waiting for checks, and submitting the result. The real action and the visual action should reinforce each other.

### Extensibility Before Convenience

AI City must be designed for long-term expansion.

Short-term convenience should not trap the project in one-off UI patterns, hard-coded entities, or isolated feature logic. Systems should be shaped so that new companies, districts, tools, agents, buildings, and interactions can be added without rewriting the foundation.

This does not mean over-engineering early. It means avoiding decisions that make the world harder to grow.

## 3. World Architecture

AI City is organized through a spatial and organizational hierarchy.

### World

The World is the complete simulation space.

It contains districts, global time, shared rules, environmental state, economy-level concepts, transport systems, and cross-company activity. The World is the highest-level container for everything that exists.

### District

A District is a major region inside the World.

Districts create thematic and functional separation. One district may focus on startups, another on research labs, another on infrastructure, another on design studios, and another on public services. Districts should help the city feel navigable and expandable.

### Company

A Company is an organization operating inside the city.

Companies own buildings, employ agents, receive tasks, use tools, maintain internal structure, and produce outcomes. A company is both a business entity and a world presence.

### Building

A Building is the physical representation of a company, service, institution, or shared city function.

Buildings should communicate purpose through visual form and internal structure. A software company, AI research lab, coffee shop, data center, and design agency should not feel interchangeable.

### Floor

A Floor is a navigable level inside a Building.

Floors allow buildings to scale vertically and organize activity. A small company may have one floor. A large company may separate engineering, design, operations, leadership, support, and infrastructure across multiple floors.

### Department

A Department is an operational area within a company or floor.

Departments group agents, tasks, tools, and workflows by responsibility. Engineering, design, product, legal, research, operations, finance, and support can each have distinct spaces and behaviors.

### Agent

An Agent is an AI worker represented as an employee inside the world.

Agents have roles, state, location, capabilities, assignments, relationships, and visible behavior. They should feel like employees with responsibilities rather than abstract background processes.

### Task

A Task is a unit of work that can be assigned, represented, tracked, approved, and completed.

Tasks should exist both as data and as world behavior. A task may live on a board, appear as a conversation, move through departments, create agent activity, require tools, and produce visible output.

## 4. Technical Architecture

AI City should be organized into clear engine layers. These layers may evolve over time, but their responsibilities should remain distinct.

### Engine

The Engine owns the general simulation foundation.

Responsibilities include:

- World loop and timing
- Scene management
- Entity lifecycle
- Position and movement primitives
- Collision or spatial rules when needed
- Animation orchestration
- Interaction primitives
- Persistence boundaries
- Event dispatching

The Engine should not know project-specific business concepts such as GitHub commits, company departments, or founder approvals except through generic extension points.

### Game

The Game layer owns AI City-specific world rules.

Responsibilities include:

- District, company, building, floor, department, agent, and task models
- Simulation rules for work behavior
- Company operations
- Agent roles and workflows
- Task lifecycle
- Approval rules
- City progression
- Mapping real-world concepts into in-world concepts

The Game layer turns the generic engine into AI City.

### UI

The UI layer owns human-facing controls, overlays, menus, inspectors, and approval surfaces.

The UI should support the world, not replace it. Panels are acceptable when they clarify, inspect, command, or approve world activity. They should not become the primary representation of features that ought to exist spatially.

Responsibilities include:

- Founder controls
- Inspectors and detail panels
- Approval flows
- Toolbars and navigation
- Notifications
- Accessibility affordances
- Settings

### AI

The AI layer owns reasoning, planning, tool use, agent behavior, and integration with external AI systems.

Responsibilities include:

- Agent decision-making
- Task planning
- Tool execution
- Model calls
- Memory and context handling
- Delegation logic
- Safety and approval policies
- Translation between real AI actions and visual world actions

The AI layer should never bypass the world. It should communicate intent and progress through world events whenever possible.

## 5. Entity System

AI City should move toward a shared Entity system, but should not implement a full ECS prematurely.

The long-term direction is that many things in the world share common concepts:

- Founder
- Engineer
- Designer
- Researcher
- Tree
- Building
- Coffee Shop
- Vehicle
- Workstation
- Elevator
- Conference Room
- Delivery Drone
- Task Board

These entities may differ dramatically in behavior, but they should eventually share a common vocabulary.

Common concepts should include:

- Position: where the entity exists in the world.
- Interaction: how the founder, agents, or other entities can act on it.
- State: what condition the entity is currently in.
- Animation: how the entity communicates change over time.
- Identity: what the entity is and how it is referenced.
- Ownership: which company, district, system, or actor controls it.
- Capabilities: what the entity can do or support.

This direction should guide architecture, naming, and data modeling. However, AI City should not introduce a full entity-component-system until there is enough real complexity to justify it.

The goal is steady convergence toward reusable world primitives without freezing development under an abstract framework too early.

## 6. Future AI Integration

Real tools should eventually appear as actions inside the world.

Codex, GitHub, Firebase, Figma, deployment platforms, issue trackers, design tools, databases, analytics systems, and communication tools should not remain invisible integrations. They should be represented through places, props, machines, rooms, rituals, and agent behavior.

Example:

```text
GitHub Commit
  -> Engineer walks to workstation
  -> Computer animation begins
  -> Code task enters active state
  -> Commit is prepared
  -> Founder approval is requested if required
  -> Commit completes
  -> World state updates
```

Other examples:

```text
Figma Design Update
  -> Designer enters design studio
  -> Wall display shows active mockup
  -> Design review task appears
  -> Founder approves or requests changes
```

```text
Firebase Deployment
  -> Engineer moves to operations room
  -> Deployment console activates
  -> Build status appears in-world
  -> Deployment completes or fails visibly
```

```text
Codex Code Change
  -> Engineering agent receives task
  -> Agent reviews files at workstation
  -> Agent edits implementation
  -> Tests run as visible process
  -> Founder reviews diff
  -> Change is applied or rejected
```

The real system and the simulated world should increasingly become two views of the same activity.

## 7. Development Rules

Every new feature must answer this question:

```text
How does this exist inside the world?
```

If the answer is unclear, the feature is not ready.

If the feature can only be represented as a dashboard widget, table, modal, or detached settings page, reconsider the design. Some UI may still be necessary, but the primary concept should have a world-native representation.

Rules:

- Prefer places over pages.
- Prefer agents over background jobs.
- Prefer visible action over hidden state mutation.
- Prefer approval rituals over silent execution.
- Prefer reusable world concepts over one-off UI logic.
- Prefer simulation events over disconnected callbacks.
- Prefer spatial continuity over instant transitions.
- Prefer extensible systems over convenient shortcuts that block future growth.

Development should be judged by whether the city becomes more believable, more expressive, and more capable of hosting real AI work.

## 8. Roadmap

### Phase 1: World

Establish the foundational city experience.

Focus areas:

- Navigable world space
- Core visual identity
- Initial districts or city layout
- Basic camera and interaction model
- Foundational world objects
- Early entity concepts
- Time, state, and scene structure

Success means AI City feels like a place, not a page.

### Phase 2: Companies

Introduce companies as first-class world entities.

Focus areas:

- Company creation
- Buildings
- Floors
- Departments
- Company identity
- Workspaces and rooms
- Basic task locations

Success means companies feel like organizations with physical presence.

### Phase 3: Agents

Make AI workers visible and operational.

Focus areas:

- Agent roles
- Movement
- Workstations
- Task assignment
- Agent state
- Department workflows
- Visible work loops

Success means agents feel like employees, not status labels.

### Phase 4: Real AI

Connect real AI and development tools to world behavior.

Focus areas:

- Codex integration
- GitHub actions
- Firebase actions
- Figma actions
- Tool-specific world representations
- Approval workflows
- Real task execution
- Error and retry behavior

Success means real work can happen through the city and be understood by watching the city.

### Phase 5: AI Operating System

Evolve AI City into a full operating environment for AI companies.

Focus areas:

- Multi-company operations
- Advanced agent collaboration
- Persistent memory
- Cross-tool orchestration
- Founder governance
- Simulated and real economies of work
- Custom company systems
- Extensible third-party integrations

Success means AI City becomes the place where AI organizations are created, managed, observed, and directed.

## Closing Principle

AI City is not software about AI companies.

AI City is the place where AI companies live.
