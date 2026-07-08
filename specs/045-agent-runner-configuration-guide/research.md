# Research: Agent Runner Configuration and Real CLI Usage Guide

## Decision: Add dry-run to the existing `run` command

**Rationale**: Developers naturally reach for `run` when they want to execute workflow stages. Adding `--dry-run` previews the same path without creating another command surface.

**Alternatives Considered**:

- Add a separate `preview-run` command: rejected because it duplicates `run` options and increases CLI surface area.
- Only document `next --write`: rejected because it does not show selected agent, command, or execution stop conditions.

## Decision: Add a diagnostics command that can read workflow state

**Rationale**: Existing `detect-agent` checks default runner commands only. Real usage needs state-specific command paths and missing/unsafe configuration messages.

**Alternatives Considered**:

- Extend only `detect-agent`: rejected because users need a full state-level view for both Codex and Claude plus stage mappings.
- Depend on real CLI calls in tests: rejected because tests must remain deterministic and service-free.

## Decision: Commit examples outside `.agent-workflow/`

**Rationale**: `.agent-workflow/` is gitignored for runtime logs and local state. Committed examples belong under `tools/agent-workflow/examples/` so they can be versioned without weakening log privacy.

**Alternatives Considered**:

- Commit `.agent-workflow/example-state.json`: rejected because the entire directory is intentionally ignored.
- Store examples in specs only: rejected because README usage should point to practical copyable tooling examples.

## Decision: Improve messages without changing execution semantics

**Rationale**: Spec 043/044 safety gates are already reviewed. This feature should clarify missing CLI, unsafe command, timeout, and failed execution states without changing how successful or failed stages are recorded.

**Alternatives Considered**:

- Refactor the runner into a larger framework: rejected as unnecessary scope expansion.
- Add CLI install automation: rejected because it can introduce network, credential, and platform-specific behavior.
