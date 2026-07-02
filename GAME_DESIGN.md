# AIverse Game Design

## Vision

AIverse is a simulation-first workplace and city experience where autonomous employees pursue goals, contribute to projects, follow schedules, and react to the evolving company around them. The player grows the organization by observing the simulation, understanding its patterns, and gradually influencing the systems that shape employee work.

## Core Philosophy

AIverse should feel alive before it feels controlled. Employees are autonomous AI agents, not player puppets, and player-facing features should reveal or influence existing simulation behavior rather than replace it with isolated UI state.

## Core Gameplay Loop

The core loop is:

1. Observe employees, spaces, projects, and company state.
2. Understand how schedules, moods, work progress, layout, and project needs interact.
3. Influence conditions through lightweight decisions and workspace changes.
4. Manage higher-level systems once the player has learned the simulation.
5. Grow the company, office, capabilities, and long-term opportunities.

## Simulation Philosophy

Prefer simulation over scripting. New features should reuse Employee AI, Schedule, Projects, Company Progression, Office Layout, Conversation, Navigation, and Simulation systems whenever practical. Presentation layers should expose source-of-truth simulation state instead of maintaining duplicate state for convenience.

## Player Experience Goals

The player should feel like a founder or operator who learns by watching the workplace run. Features should be readable, lightweight, and non-blocking at first, then deepen once the basic loop is playable and validated. The game should reward attention, pattern recognition, and thoughtful influence rather than direct employee control.

## Progression Philosophy

Progression should move from observation to understanding, then influence, management, and growth. Early progression should reveal what employees are doing and why. Later progression can unlock broader planning, stronger tools, and more complex company systems without breaking employee autonomy.

## Long-term Roadmap

Long-term expansion can include richer dialogue, memory, economy, multiplayer, save/load, deeper project management, more sophisticated employee behavior, and broader city systems. These systems should be added through active Spec Kit features and should extend the simulation rather than bypass it.

## Vertical Slice Strategy

Every feature should reach a minimum playable vertical slice before polish or expansion. The preferred order is Spec, Minimum Playable Version, Validation, Polish, and Expansion. Each slice should prove the player value, integration point, and validation path before additional scope is added.

## What AIverse Intentionally Avoids

AIverse intentionally avoids speculative systems, duplicated presentation state, direct employee control, one-off scripted behavior, unrelated refactors, and full dialogue, relationship, quest, economy, or multiplayer systems unless the active Spec Kit feature explicitly requires them.

## Future Expansion Principles

Future expansion should preserve the existing architecture, compose with current systems, and keep new interfaces maintainable. Significant architectural changes should document why existing systems were insufficient and how the change supports future extensions.
