# Data Model: Persistent ADOS Playwright Home Canvas Validation Command

## Default Validation Command List

- **Description**: Canonical full validation sequence used when no explicit override is supplied.
- **Required values**:
  - `npm test`
  - `npx tsc --noEmit`
  - `npm run build`
  - `npm run test:e2e:home-canvas`
  - `git diff --check`
- **Validation rules**:
  - Includes exactly one home canvas smoke command.
  - Keeps the home canvas smoke command after build validation and before diff cleanliness checks.

## Workflow State Fixture

- **Description**: Test-local workflow state used to generate prompts and run local orchestration helpers.
- **Fields relevant to this feature**:
  - `validationCommands`: defaults to the canonical command list unless a test explicitly supplies an override.
- **Validation rules**:
  - Default helpers should not hand-copy stale validation command arrays.
  - Tests that intentionally verify override behavior may still supply custom commands.

## Explicit Validation Override

- **Description**: Operator- or test-supplied validation command list.
- **Validation rules**:
  - Continues to take precedence over defaults.
  - Is not modified by this feature.
