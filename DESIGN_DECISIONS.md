# AIverse Design Decisions

## Overview

This document maintains a chronological record of significant AIverse design and architecture decisions. It exists to preserve the reasoning behind major choices so future Spec Kit work can extend the project consistently instead of re-deciding core direction from scratch.

Record decisions when they affect gameplay direction, system architecture, feature lifecycle, simulation behavior, player interaction model, or long-term extensibility. Keep entries concise, date them, and explain the tradeoffs clearly enough that a future contributor can understand why the decision was made.

## Decision Template

Each decision should contain:

- Date
- Decision
- Context
- Alternatives Considered
- Reason for the Final Choice
- Consequences
- Future Revisit Conditions

Use this format:

```md
### YYYY-MM-DD - Decision Title

- Date:
- Decision:
- Context:
- Alternatives Considered:
- Reason for the Final Choice:
- Consequences:
- Future Revisit Conditions:
```

## Initial Decisions

### 2026-07-03 - AIverse Is a Living AI Company Simulation

- Date: 2026-07-03
- Decision: AIverse is designed as a living AI company simulation.
- Context: The project centers on autonomous employees, company growth, office systems, projects, schedules, and player observation.
- Alternatives Considered: A task-driven management game, a scripted office narrative, or a direct-control employee simulator.
- Reason for the Final Choice: A living simulation best supports emergent behavior, long-term extensibility, and the player fantasy of understanding and shaping an autonomous company.
- Consequences: Features should integrate with simulation state and avoid isolated one-off behavior.
- Future Revisit Conditions: Revisit only if the core game direction changes away from autonomous company simulation.

### 2026-07-03 - Prefer Simulation Over Scripting

- Date: 2026-07-03
- Decision: Simulation behavior is preferred over scripted behavior.
- Context: AIverse needs employees and systems to feel consistent, inspectable, and extensible across features.
- Alternatives Considered: Hard-coded feature scripts, bespoke UI-only flows, or event-specific logic.
- Reason for the Final Choice: Simulation creates reusable state and behavior that can support future dialogue, memory, economy, multiplayer, and save/load features.
- Consequences: New gameplay should derive from existing systems where possible.
- Future Revisit Conditions: Revisit for isolated presentation effects that do not affect gameplay or simulation state.

### 2026-07-03 - Prefer Observation Before Interaction

- Date: 2026-07-03
- Decision: Player-facing features should start with observation before adding interaction.
- Context: The player needs to understand employee behavior before meaningfully influencing it.
- Alternatives Considered: Dialogue-first interaction, direct command controls, or immediate management panels.
- Reason for the Final Choice: Observation teaches the simulation and keeps early features lightweight.
- Consequences: Features such as Employee Insight should reveal current state without interrupting work.
- Future Revisit Conditions: Revisit once a vertical slice proves that players understand the observed systems.

### 2026-07-03 - Employees Remain Autonomous AI Agents

- Date: 2026-07-03
- Decision: Employees remain autonomous AI agents.
- Context: Employees already have AI state, schedules, work progress, project context, and office presence.
- Alternatives Considered: Direct player control, scripted employee responses, or manual assignment of every employee action.
- Reason for the Final Choice: Autonomy is central to the company simulation and creates richer long-term behavior.
- Consequences: Player systems should influence conditions and context rather than override employee agency.
- Future Revisit Conditions: Revisit only for explicit Spec Kit features that introduce bounded influence mechanics.

### 2026-07-03 - Reuse Existing Systems Before Creating New Ones

- Date: 2026-07-03
- Decision: Existing systems must be searched before creating new services, state, interfaces, models, or systems.
- Context: AIverse already has Employee AI, Schedule, Projects, Company Progression, Office Layout, Conversation, Navigation, and Simulation systems.
- Alternatives Considered: Creating feature-local state or parallel presentation models by default.
- Reason for the Final Choice: Reuse protects architectural coherence and prevents duplicated state.
- Consequences: New features should compose with existing systems unless reuse is impossible.
- Future Revisit Conditions: Revisit when an existing system cannot represent a required concept without harmful coupling.

### 2026-07-03 - Vertical Slice First

- Date: 2026-07-03
- Decision: Deliver a playable vertical slice before expanding a feature.
- Context: AIverse features can become broad quickly because many simulation systems connect to one another.
- Alternatives Considered: Building full future-facing systems upfront or completing every possible subsystem before playability.
- Reason for the Final Choice: Vertical slices prove real player value and integration quality early.
- Consequences: Development should move from Spec to Minimum Playable Version, Validation, Polish, and Expansion.
- Future Revisit Conditions: Revisit only if a foundational technical phase is required before any playable behavior can exist.

### 2026-07-03 - MVP First

- Date: 2026-07-03
- Decision: Implement only what the active Spec requires.
- Context: The project has long-term ambitions including dialogue, memory, economy, multiplayer, and save/load.
- Alternatives Considered: Speculative implementation of future systems during current feature work.
- Reason for the Final Choice: MVP-first development reduces risk and keeps each phase verifiable.
- Consequences: Future functionality should be deferred unless explicitly required by the active Spec Kit feature.
- Future Revisit Conditions: Revisit when a later Spec explicitly expands the feature scope.

### 2026-07-03 - One Commit Per Completed Phase

- Date: 2026-07-03
- Decision: Create exactly one commit per completed phase.
- Context: The project follows Spec Kit phases and benefits from reviewable, coherent history.
- Alternatives Considered: One commit per task, one large feature commit, or ad hoc commits.
- Reason for the Final Choice: Phase commits balance traceability, reviewability, and workflow discipline.
- Consequences: All tasks in a phase should be completed, validated, and committed together.
- Future Revisit Conditions: Revisit if branch management or CI requirements require smaller atomic commits.

### 2026-07-03 - Phase-Based Autonomous Development

- Date: 2026-07-03
- Decision: Development proceeds phase-by-phase with autonomous technical decisions.
- Context: The assistant should continue through a phase without stopping for routine implementation details.
- Alternatives Considered: Stopping after every task or asking for approval on routine technical choices.
- Reason for the Final Choice: Phase-based autonomy preserves momentum while keeping meaningful stop conditions for product and design decisions.
- Consequences: Stop only for feature completion, new Spec needs, gameplay or player-facing UI/UX decisions, equally valid product directions, unresolved blockers, or validation failures.
- Future Revisit Conditions: Revisit if autonomous implementation produces repeated misalignment with project goals.

### 2026-07-03 - Employee Insight Precedes Dialogue

- Date: 2026-07-03
- Decision: Employee Insight should precede dialogue systems.
- Context: The active Employee Insight feature lets the player observe nearby employees without interrupting their work.
- Alternatives Considered: Building dialogue first, adding an interaction key, or creating direct employee conversations immediately.
- Reason for the Final Choice: Insight supports observation-first gameplay and creates a foundation that dialogue can extend later.
- Consequences: Employee Insight should be non-blocking, proximity-based, and designed for later dialogue without requiring a refactor.
- Future Revisit Conditions: Revisit when an active Spec Kit feature explicitly introduces dialogue.

### 2026-07-03 - Player Influences Employees Rather Than Directly Controlling Them

- Date: 2026-07-03
- Decision: The player influences employees rather than directly controlling them.
- Context: The player progression model moves from Observe to Understand, Influence, Manage, and Grow.
- Alternatives Considered: Direct employee commands, manual employee possession, or fully scripted employee outcomes.
- Reason for the Final Choice: Influence preserves employee autonomy while giving the player meaningful agency.
- Consequences: Gameplay systems should affect environment, priorities, resources, or company context instead of replacing employee decision-making.
- Future Revisit Conditions: Revisit only for bounded mechanics that preserve autonomy and are approved by a Spec.

### 2026-07-03 - Expose Existing AI State Instead of Duplicating UI State

- Date: 2026-07-03
- Decision: Existing AI state should be exposed for UI instead of duplicated only for presentation.
- Context: Employee Insight and related UI need to display employee role, task, progress, project, mood, and current AI state.
- Alternatives Considered: Creating separate UI-only state, fake display state, or parallel models disconnected from simulation.
- Reason for the Final Choice: Source-of-truth simulation state keeps UI accurate and prevents drift.
- Consequences: Presentation layers should derive view models from existing services and controller snapshots.
- Future Revisit Conditions: Revisit when cached or transformed presentation state is required for performance, persistence, or cross-session behavior.
