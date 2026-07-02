# UI Contract: Employee Knowledge Panel

## Purpose

Define the player-facing behavior for the Employee Knowledge panel. This is a UI contract, not an API contract.

## Trigger Contract

- The panel uses the existing Employee Insight-selected employee as its observation target.
- The panel appears only when a knowledge view model can be derived for the current Insight target.
- The panel hides when Employee Insight has no target, a blocking overlay is open, or source data is unavailable enough to make the panel misleading.
- The panel updates automatically when source simulation data changes.

## Content Contract

The panel must be capable of showing these fields when source data exists:

- Name
- Role
- Current AI State
- Current Task
- Current Project
- Work Progress
- Mood
- Thinking
- Why
- Current Goal
- Today's Schedule
- Recent Activity Timeline
- Planned Next Activity
- AI Confidence

The first vertical slice should prioritize:

- Name
- Role
- Current AI State
- Current Task
- Current Project
- Work Progress
- Thinking
- Why
- Current Goal
- Planned Next Activity

## Interaction Contract

- The panel is read-only.
- The panel must not show dialogue choices.
- The panel must not show an interaction key.
- The panel must not assign tasks, alter schedules, modify relationships, or directly control employees.
- The panel must not block player movement or existing office controls.

## Source Contract

- All panel content derives from existing Employee AI, Schedule, Project, Conversation, Progression, and Insight systems.
- Missing optional source fields must produce omitted or unavailable content.
- The panel must not store duplicate simulation state for presentation.
- The panel must not create fake timeline events, fake mood, fake confidence, fake schedule entries, or fake reasoning.

## Future Extension Contract

- Future dialogue may consume knowledge context but Employee Knowledge does not own dialogue flow.
- Future memory, relationship, management, economy, multiplayer, and save/load systems may consume derived knowledge context but Employee Knowledge must remain read-only unless a future Spec explicitly expands it.
