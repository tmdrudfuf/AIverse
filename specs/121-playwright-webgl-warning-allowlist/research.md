# Research: Playwright WebGL Warning Allowlist

## Decision: Use A Narrow Warning-Only Allowlist

**Rationale**: The existing smoke test fails on warning and error console messages plus page errors. The useful behavior is strict failure on unknown browser signals. The problem is confined to known warning-level WebGL environment messages that do not indicate a failed canvas boot. A narrow allowlist preserves signal quality without hiding page errors or console errors.

**Alternatives considered**:

- Ignore all console warnings: rejected because it would hide actionable application warnings.
- Ignore all WebGL-related messages: rejected because broad substring matching could hide serious graphics failures.
- Remove console warning collection from the smoke: rejected because Spec 118 intentionally added warning detection.

## Decision: Extract Filtering Into A Small Test-Support Helper

**Rationale**: The Playwright spec should remain easy to read, while the allowlist behavior needs focused unit coverage. A helper under `src/test-support/` is included by TypeScript and Vitest, unlike files under `e2e/`, which are excluded from unit test discovery.

**Alternatives considered**:

- Keep inline filtering in the Playwright spec: rejected because allowlist behavior would be harder to test without running browser E2E.
- Add a new runtime dependency: rejected because a static allowlist does not justify additional dependencies.

## Decision: Do Not Run Validation From This Runtime

**Rationale**: The ADOS handoff explicitly prohibits validation, review, publishing, merging, deployment, and GitHub mutation from this runtime. The implementation documents the commands for the separate validation runtime.

**Alternatives considered**:

- Run focused tests locally anyway: rejected because it conflicts with the handoff execution policy.
