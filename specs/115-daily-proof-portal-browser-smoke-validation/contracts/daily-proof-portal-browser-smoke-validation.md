# Contract: Daily Proof Portal Browser Smoke Validation

## Smoke Contract

The focused smoke coverage must expose two independently understandable checks:

1. **Portal entry smoke**
   - Starts from a fresh office Project Portal controller state.
   - Opens the portal.
   - Clears the initial just-opened frame.
   - Activates the default Daily Proof project.
   - Observes `project-dashboard` mode for `daily-proof`.
   - Confirms implementer, reviewer, validation, publication, merge, deployment, and GitHub mutation paths have not started.

2. **Runtime-start chain smoke**
   - Uses the deterministic Daily Proof repository and issue fixtures.
   - Drives the existing approval, promotion, assignment, preparation, work start, execution plan, readiness, human approval, preflight, and runtime-start sequence.
   - Observes exactly one runtime-start record for Daily Proof.
   - Confirms no implementer, reviewer, validation, publication, merge, deployment, or GitHub mutation path has started.

## Safety Constraints

- The smoke coverage must not invoke live GitHub.
- The smoke coverage must not spawn CLI agents.
- The smoke coverage must not execute validation commands.
- The smoke coverage must not mutate the primary repository.
