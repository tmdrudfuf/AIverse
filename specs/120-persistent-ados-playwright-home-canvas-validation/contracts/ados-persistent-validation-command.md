# Contract: ADOS Persistent Validation Command

## Default Fixture Contract

When a workflow test helper creates a default state:

- The default `validationCommands` value is derived from the canonical default validation command list.
- The resulting list contains `npm run test:e2e:home-canvas`.
- The command appears after `npm run build` and before `git diff --check`.

## Override Contract

When a workflow test or caller supplies explicit validation commands:

- The supplied command list remains the effective list.
- The workflow does not append or inject the home canvas command into the override.

## Runtime Boundary

This feature does not execute validation commands, start review, publish, merge, deploy, mutate GitHub, or modify the primary repository.
