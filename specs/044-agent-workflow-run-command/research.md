# Research: Agent Workflow Run Command

## Decision: Add orchestration above `runWorkflowAgent`

**Rationale**: Spec 043 already handles safe execution, diagnostics, path containment, and failure-gated result recording. A thin orchestration layer can loop and summarize without duplicating process safety.

**Alternatives considered**:

- Put loop logic directly in `cli.js`: rejected because it would be harder to test with fake adapters.
- Expand `runWorkflowAgent`: rejected because one-stage execution should remain a reusable primitive.

## Decision: Stop on failure by inspecting execution record output state

**Rationale**: Spec 043 classifies non-zero, timeout, interrupted, and empty output. The run command can stop on anything except `ok` to avoid unsafe progress.

## Decision: Multi-stage mode requires explicit `--until-blocked`

**Rationale**: Running a single stage by default is safer and easier to audit.
