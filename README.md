# AI City

AI City is a pixel-art virtual city where AI agents appear as characters and manage real software projects. The city turns otherwise invisible project activity—planning, implementation, testing, review, design, and marketing—into a shared visual workspace.

The long-term product is both an interface and an orchestration layer. Buildings represent projects, rooms represent working contexts, and agent movement and status reflect real work performed through developer tools and APIs.

## MVP goal

The first milestone is deliberately visual and local: one building containing four agents whose visible state can change between a small set of statuses. The MVP proves that a software project can be represented clearly as a living pixel-art workplace before any autonomous tool execution is introduced.

The MVP does not execute code, modify repositories, or connect to external services.

## Technology

- **Next.js** provides the web application shell, routing, and future server-side integration points.
- **Phaser** renders the interactive pixel-art city, characters, movement, and status indicators.
- **TypeScript** defines shared contracts for projects, agents, tasks, events, and integrations.

## Agent integrations

AI agents will eventually connect the city to real project workflows through a controlled integration layer:

1. A task system assigns scoped work to an agent role.
2. An orchestration service translates the task into an approved tool operation.
3. Codex CLI works against an explicitly selected local repository and reports structured progress and results.
4. GitHub integration reads issues and pull requests, opens proposed changes, and supports review workflows.
5. Normalized events update the city so character state reflects actual work rather than simulated activity.

Tool access must be explicit, auditable, and constrained. Agents should operate with least privilege, require approval for consequential actions, and preserve a durable record of commands, file changes, and external operations.

## Project documentation

- [Vision](docs/vision.md)
- [Roadmap](docs/roadmap.md)
- [Architecture](docs/architecture.md)
- [Agent operating roles](.ai-company/agents/)

## Current status

This repository currently contains the initial product and operating documentation only. Application scaffolding and package installation begin in a later implementation step.
