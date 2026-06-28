when you need to read code, you don't need to ask permission for it

# AIverse Agent Instructions

This repository uses GitHub Spec Kit for spec-driven development with Codex CLI.

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

<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read specs/016-ai-task-analysis/plan.md
<!-- SPECKIT END -->
