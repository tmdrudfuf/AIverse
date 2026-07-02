when you need to read code, you don't need to ask permission for it

# AIverse Agent Instructions

This repository uses GitHub Spec Kit for spec-driven development with Codex CLI.

## Permanent Instructions

- Follow the Spec Kit workflow.
- Inspect relevant files before editing.
- Make the smallest correct change.
- Prefer readable and maintainable code.
- Preserve the existing architecture and coding style.
- Do not make unrelated refactors.
- Use concise responses unless more detail is requested.

## Required Workflow

All product changes must follow this order:

1. Specification: use `$speckit-specify` to create or update `specs/<feature>/spec.md`.
2. Plan: use `$speckit-plan` to create `plan.md` and supporting design artifacts.
3. Tasks: use `$speckit-tasks` to create `tasks.md`.
4. Implementation: use `$speckit-implement` only after the spec, plan, and tasks are present and aligned.

Do not implement application features directly from a prompt unless the active feature has completed the Spec -> Plan -> Tasks sequence.

## Repository Boundaries

- Existing application code must not be changed while initializing or maintaining Spec Kit infrastructure.
- Feature work belongs under `specs/<feature>/` until implementation begins.
- Keep specs focused on user value and acceptance criteria.
- Keep plans focused on technical approach, validation, and architectural fit.
- Keep tasks small, ordered, independently verifiable, and tied to user stories.

## Validation

Run these validations after every implementation:

- `npx tsc --noEmit`
- `npm run build`
- `git diff --check`
- `git diff --cached --check`

Fix any validation failures before finishing.

## Completion Expectations

- Explain what changed.
- Explain why.
- List files modified.
- Include validation results.
- Commit only after all validations pass.

<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read specs/026-employee-insight-system/plan.md
<!-- SPECKIT END -->

## AIverse Autonomous Development Workflow

### Development Flow

- Work phase-by-phase, not task-by-task.
- Automatically continue to the next phase until a stop condition is met.
- Complete every task in the current phase before committing.
- Create exactly one commit per completed phase.
- Never stop after completing a single task unless blocked.

### Implementation Principles

- Inspect existing code before making changes.
- Make the smallest correct implementation.
- Prefer extending existing systems instead of creating parallel ones.
- Preserve the current architecture and coding style.
- Avoid unrelated refactoring.

### Validation

- Validate after tasks when appropriate.
- Before every phase commit always run:
  - `npm test`
  - `npx tsc --noEmit`
  - `npm run build`
  - `git diff --check`
  - `git diff --cached --check`
- Never commit while validation is failing.

### Autonomous Decisions

Automatically decide:

- implementation details
- internal architecture
- interfaces
- testing
- refactoring
- performance improvements
- code organization

Stop only if:

- the active Spec Kit feature is complete
- a new Spec Kit feature is required
- a gameplay decision is required
- a player-facing UI/UX decision is required
- multiple product directions are equally valid
- a blocking issue cannot be resolved
- validation cannot be made to pass

### Reporting

When stopping, report only:

- completed phases
- completed tasks
- commits created
- validation summary
- current progress
- reason for stopping
- recommended next action

## AIverse Design Principles

- Prefer simulation over scripting.
- Every new feature should integrate with existing AI systems whenever possible.
- Reuse Employee AI, Schedule, Projects, Company Progression, Office Layout, and Conversation systems before introducing new data or logic.
- Player interactions should observe and influence the simulation rather than replace it.
- Build extensible systems that support future dialogue, memory, economy, multiplayer, and save/load features.
- Keep player-facing features lightweight first, then expand them after the core loop works.
- Do not add full dialogue, relationship, quest, economy, or multiplayer systems unless the active Spec Kit feature explicitly requires them.

# AIverse Autonomous Development Workflow

## Development Flow

- Work phase-by-phase instead of task-by-task.
- Automatically continue to the next phase until a stop condition is reached.
- Complete every task within the current phase before committing.
- Create exactly ONE commit per completed phase.
- Never stop after a single task unless blocked.

## Implementation Principles

- Inspect existing code before making changes.
- Make the smallest correct implementation.
- Preserve the current architecture whenever practical.
- Avoid unrelated refactoring.
- Prefer extending existing systems instead of introducing parallel systems.
- Prefer composition over duplication.
- Prefer maintainability over convenience.

## Validation

Validate during implementation when appropriate.

Before every phase commit always run:

- `npm test`
- `npx tsc --noEmit`
- `npm run build`
- `git diff --check`
- `git diff --cached --check`

Never commit while validation is failing.

## Autonomous Technical Decisions

The assistant should autonomously decide:

- implementation details
- code organization
- internal architecture
- interfaces
- testing
- performance improvements
- refactoring

Do not stop for technical decisions.

## Stop Conditions

Stop only if:

- the active Spec Kit feature is complete
- a new Spec Kit feature is required
- a gameplay decision is required
- a player-facing UI/UX decision is required
- multiple product directions are equally valid
- validation cannot be made to pass
- a blocking issue cannot be resolved automatically

## Reporting

When stopping report only:

- completed phases
- completed tasks
- commits created
- validation summary
- current progress
- reason for stopping
- recommended next action

# AI Development Rules

Before creating any new service, state, interface, model or system:

Search for reusable functionality in:

- Employee AI
- Schedule
- Projects
- Company Progression
- Office Layout
- Conversation
- Navigation
- Simulation

Only create new systems when reuse is impossible.

Never duplicate existing state only for presentation purposes.

# Vertical Slice First

Always deliver a playable vertical slice before expanding a feature.

Development order should be:

Spec -> Minimum Playable Version -> Validation -> Polish -> Expansion

Do not build future functionality before the current slice is complete.

# MVP First

Implement only what the active Spec requires.

Avoid speculative implementation.

Prefer the smallest implementation that satisfies the specification.

# Simulation First

Prefer simulation over scripting.

Prefer observation before interaction.

Expose existing simulation state instead of creating fake UI state.

Player interactions should influence the simulation rather than replace it.

# Player Philosophy

The player should progress through these stages:

Observe -> Understand -> Influence -> Manage -> Grow

The player should never directly control employees.

Employees remain autonomous AI agents.

# Feature Lifecycle

Every feature should follow this lifecycle:

Spec -> Vertical Slice -> Playable -> Polish -> Expansion

Do not skip directly to expansion.

# Technical Debt

Do not knowingly introduce duplicated logic.

Prefer cleaning small technical debt during the current phase instead of postponing it indefinitely.

Leave TODO comments only when the active Spec explicitly defers future work.

# Architecture Decisions

When making a significant architectural change:

- document the reasoning
- explain why existing systems were insufficient
- keep future extensions in mind

Only do this for significant changes.
