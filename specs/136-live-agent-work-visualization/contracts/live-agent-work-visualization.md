# Contract: Live Agent Work Visualization

## Semantic Mapping Contract

- Inputs come from the selected project's persisted ADOS/project state only.
- Raw implementation stages such as `implementer`, `implementer_fix`, and `validation_recovery_implementer` map to Engineering/Implementing.
- Validation stages map to Validation / QA/Validating.
- Review stages map to Review/Reviewing.
- Publication stages such as `exact_head`, `push`, `pr`, `pr_refresh`, `publication_gate`, `merge`, and `cleanup` map to Project Status / Operations/Publishing.
- Blocked, recovery, failed, timed-out, cancelled, and intervention states use warning treatment and never display as normal idle activity.
- COMPLETE/Completed clears stale active work labels.
- Missing selected-project run state maps to no-active-run/Idle.
- Semantic role and provider identity are separate fields.

## NPC Contract

- Employee view models use existing `EmployeeNpcViewModel` and `EmployeeNpcMovementService` paths.
- Semantic destinations resolve through existing rendered office anchors.
- Engineering, Review, Validation / QA, Operations, and shared/idle destinations remain available to the renderer.
- Old movement timestamps settle instead of leaving employees permanently moving.

## Project Status Contract

- The Spec 135 Project Status area renders selected-project run data when available.
- Display may include project name, spec path, feature branch, current stage, lifecycle, safe reason text, and last update timestamp.
- Display must not include fabricated percentages or hard-coded Daily Proof state.

## Preservation Contract

- Spec 135 office departments remain present: Engineering, Review, Validation / QA, Project Status, lounge/shared space, reception/exit, and project-company identity.
- Existing project portal and office interaction contracts remain usable.
