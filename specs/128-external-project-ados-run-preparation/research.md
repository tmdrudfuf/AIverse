# Research: External Project ADOS Run Preparation

## Decision: Model preparation as local-only workflow state

**Rationale**: The feature records a handoff before any runtime or validation begins. Keeping it as keyed local workflow state matches the development request draft pattern and avoids changing project registry identity, tasks, employees, or runtime collections.

**Alternatives considered**: Creating an execution plan was rejected because existing execution plans require active promoted task and work-session state. Starting or probing an ADOS runtime was rejected by the handoff policy.

## Decision: Use existing browser office session persistence

**Rationale**: External project draft, repository identity, and development request draft state already survive through `BrowserOfficeSessionService`. The preparation should use the same continuity path.

**Alternatives considered**: Adding a new storage key was rejected because it would duplicate session ownership and increase restore ordering risk.

## Decision: Render a compact dashboard row

**Rationale**: The dashboard already uses lower rows for workflow state summaries. A compact row makes the preparation visible without adding a new mode or workflow screen.

**Alternatives considered**: A separate edit/review screen was rejected because this slice is preparation-only and has no free-form editing.
