# Research: Project Portal Text Overflow and Layout Stability

## Decision: Fit Text At The View Boundary

**Rationale**: The overflow is a rendering concern caused by fixed panel dimensions and dynamic text. The existing data providers should continue returning complete labels and status values, while the portal view decides how much is visible in each panel.

**Alternatives considered**:
- Shorten provider output: rejected because other consumers may need full labels.
- Add scrolling to every portal panel: rejected because the current overlay is keyboard driven and compact.

## Decision: Prefer Wrap, Clamp, Then Drop Low-Priority Rows

**Rationale**: Users should see as much content as possible without collision. Core rows such as status, activity, advisory, selected actions, and instructions must remain readable; optional rows can be shortened or omitted.

**Alternatives considered**:
- Always truncate everything to one line: rejected because summaries and advisory rows lose too much meaning.
- Expand the portal overlay: rejected because it risks breaking smaller viewports.

## Decision: Cover With Deterministic Rendering Tests

**Rationale**: The portal view already has a scene stub that records rendered text and panels. Focused tests can verify row positions and truncation behavior without starting a browser, server, review, or validation runtime.

**Alternatives considered**:
- Manual visual inspection only: rejected because the feature is specifically about preventing regressions.
- End-to-end browser screenshots: rejected for this runtime because the handoff prohibits validation and server/review/deploy actions.
