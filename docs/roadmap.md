# Roadmap

The roadmap is ordered by validation risk. Each phase should produce a usable, testable capability before the next integration is introduced.

## Phase 1: One building, four agents, visual status only

Build the smallest convincing city experience.

- Render one pixel-art project building.
- Show four initial agent characters: PM, engineer, QA, and reviewer.
- Represent a fixed set of visual states such as idle, assigned, working, blocked, and done.
- Allow status changes through local mock data or developer controls.
- Establish shared TypeScript models for projects, agents, roles, and statuses.
- Do not execute tools or modify project files.

**Exit condition:** a user can identify every agent and correctly understand each agent's current visual status.

## Phase 2: Task system connected to local files

Connect the visual model to a real, local task lifecycle.

- Create, assign, update, and complete tasks.
- Associate one explicitly selected local project directory with the building.
- Read approved project metadata and task artifacts from local files.
- Persist task history and agent state.
- Display evidence and errors alongside visual status.
- Define permission boundaries before any write operation is enabled.

**Exit condition:** task and agent state survive reloads and accurately reflect a bounded local project workflow.

## Phase 3: Codex CLI integration

Allow agents to perform controlled implementation work.

- Add a server-side adapter for Codex CLI.
- Convert assigned tasks and role instructions into scoped execution requests.
- Stream normalized progress events to the task system and city.
- Capture commands, changed files, results, and failures in an audit trail.
- Add cancellation, timeouts, concurrency controls, and approval gates.
- Keep Codex credentials and execution capabilities outside the browser.

**Exit condition:** an approved task can invoke Codex CLI in the selected repository and return an inspectable result without bypassing access controls.

## Phase 4: GitHub PR/review integration

Connect completed work to a collaborative review lifecycle.

- Authenticate through a narrowly scoped GitHub integration.
- Read relevant repository, issue, branch, check, and pull-request state.
- Allow agents to prepare branches and pull requests with user-approved actions.
- Route pull requests through QA and reviewer roles.
- Reflect checks, review findings, requested changes, and merge readiness in the city.
- Require explicit policy for merge authority.

**Exit condition:** a local task can progress to a GitHub pull request with traceable QA and review evidence.

## Phase 5: Multiple buildings/projects

Scale the proven workflow into a city of projects.

- Represent multiple repositories as distinct buildings.
- Isolate each project's configuration, permissions, tasks, and audit records.
- Add a city-level portfolio view and cross-project navigation.
- Support project-specific agent teams and integration settings.
- Introduce resource and concurrency management across projects.
- Measure throughput, failure modes, and human approval load without reducing agents to vanity metrics.

**Exit condition:** users can operate multiple isolated projects and understand their state from a single city without losing project-level control.

## Roadmap discipline

Security, observability, accessibility, and data ownership are continuous requirements. A phase is not complete when only the animation works; visual state and real system state must remain consistent under success, failure, cancellation, and restart conditions.
