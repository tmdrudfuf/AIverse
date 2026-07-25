# Research: Agent Workflow Automated Fix Loop

## Decision: Add a Separate Orchestration Module

**Rationale**: The existing `run` command handles fixed stage advancement and `run-review` handles independent review. The automated loop needs validation stages, fix-cycle guards, resume state, and conservative stop reasons. A separate `orchestrateCommand.js` keeps that logic cohesive while reusing existing helpers.

**Alternatives considered**:

- Extend `agentWorkflowRun.js`: rejected because it would overload the simple stage runner with validation and review-loop responsibilities.
- Duplicate review prompt generation: rejected because `reviewCommand.js` already implements the independent review path and safety behavior.

## Decision: Use Existing Process Adapter for Agents and Validation

**Rationale**: `createDefaultProcessAdapter` already provides timeout, interruption, stdout/stderr capture, and child cleanup. Validation commands can use the same adapter with `powershell -NoProfile -Command <command>` on Windows, and `sh -lc <command>` elsewhere.

**Alternatives considered**:

- Use `execFileSync` for validation: rejected because validation needs timeout, stdout/stderr capture, and consistent artifact recording.

## Decision: Persist After Each Completed Stage

**Rationale**: Resumability depends on state being updated after every durable checkpoint. State is updated after Implementer execution, validation, review, fix, revalidation, re-review, final verification, and terminal transitions.

**Alternatives considered**:

- Persist only at the end: rejected because interruptions would lose completed artifacts and encourage duplicate runs.

## Decision: Conservative Finding Extraction

**Rationale**: The workflow must not invent missing details. Extraction accepts markdown bullets containing file/location/problem/impact/recommendation labels, plus conservative fallbacks for file-like paths and line references. If no actionable detail is present, the loop blocks instead of starting a blind fix.

**Alternatives considered**:

- Ask the Implementer to infer fixes from any Changes Requested output: rejected because ambiguous review text should not trigger blind edits.
- Require strict JSON from Reviewer: rejected for this increment because existing review output is markdown and should remain human-readable.

## Decision: Stop on No-Change Fix

**Rationale**: A fix cycle that produces no repository diff after a Changes Requested result risks infinite loops and wasted agent runs. The workflow records a blocked terminal state and preserves artifacts.

**Alternatives considered**:

- Continue to re-review anyway: rejected because no local evidence suggests anything changed.
