# Feature Specification: Project Workspace View

## User Story
As a Founder in the office Project Portal, I can open the Daily Proof workspace from the project detail view so I can review placeholder project operations in one portal flow.

## Acceptance Criteria
- Daily Proof detail Enter/Space opens a workspace view inside the same Phaser portal overlay.
- Workspace view lists Repository, Firebase, Analytics, Tasks, and AI Agents sections with placeholder status.
- Esc navigates workspace to detail, detail to list, and list to close.
- Up/Down changes workspace section selection.
- Disabled workspace sections do not trigger executable placeholder actions.
- Portfolio and AI Lab remain disabled/coming soon and do not open workspaces.
- No GitHub, Firebase, API, task, NPC, AI agent, simulation, React overlay, or scene transition is added.

## Scope
In scope: portal state, static workspace data, controller routing, Phaser overlay rendering.
Out of scope: real integrations, project dashboards, selectable service rows, NPCs, company simulation.