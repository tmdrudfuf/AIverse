when you need to read code, you don't need to ask permission for it

# AIverse Agent Instructions

This repository uses GitHub Spec Kit for spec-driven development with CLI agents.

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

## Multi-Agent Coordination

This repository is worked on by CLI agents assigned to logical workflow roles.

- AGENTS.md remains the canonical instruction file for every agent. `CLAUDE.md` is a pointer only and must not fork instructions.
- The canonical workflow roles are **Implementer** and **Reviewer**. These are logical roles, not specific vendors, models, or products.
- Default assignment: Implementer = Codex CLI; Reviewer = Claude CLI.
- Fallback assignment: if the default Implementer is unavailable due to rate limits, quota, maintenance, or local CLI issues, the roles may be swapped. Example: Implementer = Claude CLI; Reviewer = Codex CLI.
- The reviewer should be different from the implementer whenever possible. Do not let an agent review its own implementation unless there is no reasonable alternative.
- Future agents may fill either role, including Codex CLI, Claude CLI, Gemini CLI, OpenAI CLI, Qwen CLI, and future local agents. The workflow must not depend on a specific vendor.
- Fundamental workflow: Implementer -> local validation -> Reviewer -> Implementer fixes review findings -> local validation -> Reviewer re-review -> human approval -> remote actions such as push, PR, or merge.
- Git branches, pull requests, specs, tasks, and commits are the source of truth for coordination. Do not introduce a separate manually maintained status file.
- `.specify/feature.json` and the SPECKIT-managed pointer below are hints about the last `/speckit-specify` or `/speckit-plan` invocation, not an authoritative record of the active feature. They can lag behind later task or implementation work. When it matters, determine the active feature from git state (unmerged branches, unchecked `tasks.md` items, recent commits) rather than from these files.
- Review handoff: when a PR exists, reviews and findings belong on the PR (GitHub review or comments). When no PR exists yet, review notes are appended to `specs/<feature>/review.md` (created only when first needed) using `.specify/templates/review-template.md`. Every review records the reviewed commit SHA, a decision (Approved / Changes Requested), blocking findings, suggestions, and residual risks.
- To request an independent review of the current working tree without hand-writing a prompt, run `node tools/agent-workflow/cli.js run-review --state <state.json>` (or `--dry-run` to preview). It automatically inspects the repository, builds the review prompt, runs the configured Reviewer, and reports `Approved`, `Changes Requested`, `Unknown`, `Execution Failed`, or `Timed Out`. It never commits, pushes, opens a PR, or merges.
- The Reviewer does not edit or push the Implementer's branch while reviewing, per `.ai-company/agents/reviewer.md`. If the Reviewer is later assigned as fallback Implementer, it works on its own branch or an explicitly approved handoff branch.

<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read specs/048-agent-workflow-independent-review/plan.md
<!-- SPECKIT END -->
