# Product Vision

## The idea

AI City makes AI-assisted software delivery visible, understandable, and governable. Each software project occupies a building in a pixel-art city. AI agents inhabit that building as characters with distinct roles, responsibilities, and current states.

The visual metaphor is not a decorative dashboard. It is a human-readable projection of real project activity. When an engineer agent is implementing a task, a QA agent is validating a change, or a reviewer is inspecting a pull request, the city should communicate that state without hiding the underlying evidence.

## Product promise

AI City should let a person answer three questions at a glance:

1. What work is happening?
2. Which agent is responsible?
3. What evidence supports the reported status?

From there, the user can inspect tasks, decisions, tool activity, file changes, tests, and pull requests.

## Core principles

### Reality before theater

Visual state must be derived from real task and tool events. The product should never imply that useful work occurred when it cannot provide evidence.

### Humans retain authority

Agents can propose and execute bounded work, but users control project access, permissions, approvals, and irreversible actions.

### Roles have clear boundaries

Planning, engineering, quality assurance, review, design, and marketing are separate responsibilities. Explicit handoffs make work easier to inspect and improve.

### Local-first foundations

The first operational integrations target local project files and Codex CLI. External services are added through replaceable adapters rather than embedded into the visual client.

### A city that can grow

The initial building should establish concepts that scale to multiple projects, teams, integrations, and specialized agents without requiring a new mental model.

## Initial users

- Individual developers coordinating AI-assisted work across a project.
- Small teams that need visibility and control over agent activity.
- Technical project leads evaluating where AI agents help or become blocked.

## Success criteria

AI City succeeds when users can safely delegate a bounded task, understand its live state through the city, inspect the supporting evidence, and accept or reject the result without leaving the project workflow.

## Non-goals for the initial product

- Fully autonomous company operation.
- Unrestricted shell, filesystem, or account access.
- Replacing source control, issue trackers, or developer tools.
- Simulating agent activity solely to make the city appear busy.
- Supporting many projects before one project workflow is reliable.
