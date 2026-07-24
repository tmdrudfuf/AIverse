# Research: Agent Workflow Dry Run Preview

## Decision: Extend the existing `run` command with preview-only behavior

**Rationale**: The current workflow already centralizes stage execution under `run`. Adding a preview to that command lets maintainers inspect the same stage and runner choices without creating a parallel command surface.

**Alternatives considered**:

- Add a separate `preview-run` command. Rejected because it would duplicate command routing and drift from `run`.
- Reuse `next --write` only. Rejected because it generates prompts but does not preview selected agent, command, run directory, or next step.

## Decision: Keep dry-run subprocess-free

**Rationale**: The feature exists to support safe live orchestration. Dry-run must not call the Implementer, Reviewer, or fake process adapters in production or tests.

**Alternatives considered**:

- Run CLI detection during dry-run. Rejected because availability checks are not needed to preview planned command shape and can introduce avoidable subprocess calls.

## Decision: Preserve existing safety validation before previewing commands

**Rationale**: Unsafe remote-mutating commands should never be presented as runnable. Preview should fail clearly before spawn, matching existing runner safety expectations.

**Alternatives considered**:

- Print unsafe commands with a warning. Rejected because it weakens the safety model and risks normalizing unsafe runner state.
