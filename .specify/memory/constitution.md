# AIverse Spec Kit Constitution

## Core Principles

### I. Spec First
Every product change starts with a user-facing specification in `specs/<feature>/spec.md`. Specifications describe what users need, why it matters, acceptance scenarios, edge cases, assumptions, and measurable success criteria. Specifications must avoid implementation details unless the feature is explicitly about developer-facing infrastructure.

### II. Plan Before Code
Implementation planning must happen in `specs/<feature>/plan.md` before application code changes. Plans must identify the technical approach, affected areas, validation strategy, risks, and how the work fits the existing Next.js, Phaser, React, and TypeScript architecture.

### III. Tasks Gate Implementation
No feature implementation begins until `specs/<feature>/tasks.md` exists. Tasks must be small, ordered, dependency-aware, tied to user stories where applicable, and independently verifiable. Codex should implement from tasks, not from broad feature prompts.

### IV. Preserve Application Stability
Spec Kit infrastructure changes must not modify application behavior. Feature branches should keep changes scoped to files named by the active plan and tasks. Existing user or agent changes in the working tree must be preserved unless the user explicitly asks to revert them.

### V. Validation Is Required
Each plan and task list must define how success will be checked. Validation may include TypeScript checks, builds, linting, browser verification, targeted tests, or documented manual checks, depending on the risk and surface area of the feature.

## Development Constraints

- This is a Next.js application using React, TypeScript, and Phaser.
- Keep product intent aligned with the existing project documentation in `README.md`, `docs/`, `.ai-company/`, and `PROJECT_BIBLE.md` when present.
- Do not introduce new frameworks, services, or runtime dependencies without a plan rationale.
- Keep user-facing changes incremental and independently reviewable.
- Treat AI-agent capabilities, repository access, and external integrations as auditable and least-privilege by default.

## Spec Kit Workflow

Feature work must proceed in this sequence:

1. Run `$speckit-specify <feature description>` to create the feature specification.
2. Resolve specification clarifications and quality checklist issues.
3. Run `$speckit-plan` to create the implementation plan and supporting artifacts.
4. Run `$speckit-tasks` to create actionable implementation tasks.
5. Run `$speckit-implement` only after the spec, plan, and tasks are aligned.
6. Use `$speckit-converge` when implementation drift or leftover work needs to be reconciled back into tasks.

Optional quality gates may be used when helpful: `$speckit-clarify`, `$speckit-checklist`, and `$speckit-analyze`.

## Governance

This constitution defines the repository's default development process. Changes to these principles require an explicit infrastructure-focused update and should not be mixed with application feature work. Feature plans must include a constitution check and explain any justified deviation before implementation begins.

**Version**: 1.0.0 | **Ratified**: 2026-06-25 | **Last Amended**: 2026-06-25
