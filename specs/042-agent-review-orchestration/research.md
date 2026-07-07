# Research: Agent Review Orchestration

## Decision: Plain Node.js script with CommonJS exports

**Rationale**: The repository already runs Node scripts through npm and TypeScript is configured with `allowJs`. A CommonJS script can be executed directly with `node tools/agent-workflow/cli.js` without adding a build step, runtime dependency, or ts-node.

**Alternatives considered**:

- TypeScript CLI: rejected because the repo has no existing CLI build path and this feature should remain tiny.
- Shell script: rejected because cross-platform quoting and path behavior would be fragile on Windows.
- External workflow engine: rejected because it would add dependencies and risk background automation.

## Decision: Gitignored local run directory

**Rationale**: `.agent-workflow/runs/<feature-id>/` keeps pasted outputs local and out of commits while still making each run easy to inspect.

**Alternatives considered**:

- Versioned run records: rejected because agent outputs can be noisy or contain sensitive local context.
- Database or JSONL log service: rejected as unnecessary persistence complexity.
- GitHub comments as the first storage target: rejected because the feature must not use network or GitHub write APIs.

## Decision: Deterministic stage transition rules

**Rationale**: The workflow is safe and reviewable when it derives the next prompt only from recorded local results. `Changes Requested` wins over `Approved` if both appear, which prevents an accidental approval from skipping fixes.

**Alternatives considered**:

- Natural-language classification through an AI call: rejected because no paid API or external AI calls are allowed.
- Manual stage override only: rejected because it would not satisfy the requested automatic next-prompt decision.

## Decision: Templates are Markdown files

**Rationale**: Versioned Markdown prompt templates are easy for both Codex and Claude to inspect, diff, and review.

**Alternatives considered**:

- Hard-coded prompt strings only: rejected because it hides workflow wording in code.
- Generated JSON prompt schemas: rejected because humans copy/paste these prompts into agent sessions.
