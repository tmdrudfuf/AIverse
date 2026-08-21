# Research: Daily Proof Portal Browser Smoke Validation

## Decision: Use existing controller-level smoke coverage instead of adding browser automation

**Rationale**: The project currently has Vitest, React, Next.js, and Phaser dependencies, but no Playwright or browser automation dependency. The Project Portal controller and Phaser scene stubs already exercise the same input transitions used by the browser-rendered office scene while staying deterministic and local.

**Alternatives considered**:

- Add a browser automation dependency: rejected because it expands setup and validation surface for a narrow smoke check.
- Create a manual-only checklist: rejected because the feature needs repeatable regression coverage.

## Decision: Smoke Daily Proof entry and runtime-start preparation, not downstream runtime execution

**Rationale**: The ADOS handoff explicitly forbids validation, review, publishing, merging, deployment, and GitHub mutation from this runtime. The useful smoke boundary is therefore the local Project Portal path through dashboard selection and runtime-start readiness, before implementer, reviewer, or validation runtimes start.

**Alternatives considered**:

- Start implementer, reviewer, or validation runtimes: rejected by handoff policy and feature safety requirements.
- Limit the smoke to portal open only: rejected because it would miss regressions in the Daily Proof dashboard and runtime-start preparation chain.
