# Contract: Backlog Readiness Promotion Policy

## Office Policy Control

The project backlog surface exposes project-scoped controls:

- Auto Ready On/Off toggle.
- Allowed priority checkboxes using existing priority values.
- Maximum promotions per evaluation.
- Explicit Evaluate Readiness action.
- Latest concise evaluation result.

Control changes update only the selected canonical project's Auto Ready policy.

## Evaluation Command

Input:

- Current canonical project.
- Current project binding context.
- Project-scoped Auto Ready policies.
- Existing project backlog collections.
- Existing active execution/run state.
- Existing backlog service transition primitive.

Output:

- Evaluation result with promoted tasks, skipped tasks, evaluation timestamp, and latest result text.
- Mutated existing backlog collection only when a valid same-project backlog task is promoted to Ready.

Safety contract:

- No AI call.
- No Spec 142 or Spec 144 invocation.
- No ADOS, Codex, Claude, Git, or GitHub invocation.
- No mutation outside the evaluated project.

## Portfolio Read-Only Summary

Portfolio summaries may expose:

- Auto Ready On/Off text.
- Current backlog and Ready counts.

Portfolio derivation must not alter policies or task collections.
