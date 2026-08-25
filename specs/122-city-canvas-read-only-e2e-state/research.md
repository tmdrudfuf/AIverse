# Research: City Canvas Read-Only E2E State Probe

## Decision: Use passive host attributes for the probe

**Rationale**: The canvas host already exists, is easy for browser automation to locate, and can expose simple lifecycle facts without adding a global command API or user-facing controls.

**Alternatives considered**: A `window` global was rejected because it is easier to mistake for an application API. A visible debug panel was rejected because the feature is validation-only.

## Decision: Assert probe state in the existing home canvas smoke

**Rationale**: The existing smoke is the ADOS validation gate for the home canvas. Extending it keeps the contract focused and avoids a second browser test command.

**Alternatives considered**: A separate Playwright spec was rejected because it would duplicate setup and signal collection for the same page load.

## Decision: Keep the probe read-only and non-authoritative

**Rationale**: The probe reports observable boot facts only. Gameplay systems, persistence, runtime workflows, and repository integrations must not consume it as source state.

**Alternatives considered**: Persisting probe state was rejected because the feature only needs per-page-load validation.
