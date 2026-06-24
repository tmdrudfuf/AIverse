# Architecture

## Architectural goal

AI City separates the visual world from the systems allowed to affect real projects. The Phaser scene renders state; it does not execute developer tools. Next.js hosts the application and server boundary; integration adapters communicate with local tools and external APIs under explicit policy.

## High-level components

### Web application shell

Next.js owns routing, layouts, user-facing project controls, task detail views, and server endpoints. Browser code receives safe application data and never receives tool credentials or unrestricted filesystem access.

### City simulation

Phaser renders buildings, rooms, agents, movement, and status indicators. It consumes a projection of domain state and emits user-interface intents such as selecting an agent or opening a task. It is not the source of truth for task execution.

### Domain layer

Framework-independent TypeScript models and services define the core concepts:

- `Project`: a configured software project and its integration boundaries.
- `Agent`: a role-bearing participant with capabilities and current status.
- `Task`: a bounded unit of work with ownership, lifecycle, and evidence.
- `Run`: one attempt to perform a task through an integration.
- `Artifact`: a file change, test result, report, branch, or pull request.
- `Event`: an immutable record of a meaningful state transition.
- `Approval`: a recorded human decision authorizing a protected action.

### Task orchestration

The orchestrator validates task transitions, assigns agents, applies concurrency rules, requests approvals, invokes adapters, and records results. It publishes normalized events rather than mutating the city directly.

### Integration adapters

Adapters isolate vendor- and tool-specific behavior behind narrow contracts.

- A local-project adapter reads approved files and metadata.
- A Codex CLI adapter starts controlled runs and translates output into domain events.
- A GitHub adapter handles repository, issue, pull-request, review, and check operations.
- Future adapters can add services without coupling them to Phaser.

### Persistence and event history

Current task state should be stored alongside an append-only activity history. The current state supports fast rendering; the event history supports audit, debugging, recovery, and explanation.

## Data flow

1. A user or approved integration creates a task.
2. The domain layer validates it and the orchestrator assigns an eligible agent.
3. The orchestrator checks policy and obtains any required approval.
4. An adapter performs the bounded operation and emits progress or result events.
5. Events update persisted task and agent state.
6. The client receives a safe state projection.
7. Phaser maps that projection to character animation and visible status.

## State model

The initial shared status vocabulary should remain small:

- `idle`: available, with no active task.
- `assigned`: owns a task that has not started.
- `working`: actively processing a task or tool run.
- `blocked`: cannot continue without input or a resolved dependency.
- `reviewing`: inspecting an artifact or decision.
- `done`: completed the current task with recorded evidence.
- `failed`: stopped because an operation did not complete successfully.

Domain events should drive transitions. Animation completion must never change domain state.

## Security boundary

Tool execution belongs on the trusted server or local runtime side of the architecture. Core controls include:

- Explicit project-root allowlists and canonical path validation.
- Least-privilege credentials per integration.
- Capability-based agent permissions by role and project.
- Approval gates for writes, external publication, merge, deletion, and other consequential operations.
- Redaction of secrets from prompts, logs, events, and client payloads.
- Timeouts, cancellation, output limits, and concurrency limits.
- Durable audit records linking every protected action to a task, run, agent, and approval.

## Suggested source boundaries

When application work begins, organize by responsibility rather than placing all behavior inside the game scene:

```text
src/
  app/             Next.js routes, layouts, and server endpoints
  city/            Phaser scenes, sprites, animation, and state projection
  domain/          Entities, value types, policies, and lifecycle rules
  orchestration/   Task coordination, approvals, and event handling
  integrations/    Local project, Codex CLI, GitHub, and future adapters
  persistence/     Repositories, event history, and migrations
  shared/          Narrow cross-boundary utilities and contracts
```

This is a target boundary, not application scaffolding created by this documentation step.

## Early architecture decisions

- Use Next.js, Phaser, and TypeScript as the initial stack.
- Treat the domain task model—not Phaser—as the source of truth.
- Keep tool execution and secrets out of browser code.
- Normalize integration activity into stable domain events.
- Design for one project first while including a project identifier in persisted domain records.
- Prefer explicit, inspectable workflows over opaque agent autonomy.

## Open decisions

These choices should be resolved with implementation evidence in later phases:

- Persistence technology and event retention policy.
- Local companion process versus a fully server-hosted execution runtime.
- Real-time transport for state updates.
- Authentication and multi-user authorization model.
- Isolation strategy for concurrent Codex runs.
- Deployment model for projects that must remain entirely local.
