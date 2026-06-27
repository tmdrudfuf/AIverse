# Research: Project Portal Selection

## Decision: Clamp selection at bounds

**Rationale**: Clamping is deterministic and avoids surprise jumps between first and last rows.

**Alternatives considered**: Wrapping selection. Rejected for this phase because clamping is simpler to test and explain.

## Decision: Allow disabled projects to show detail

**Rationale**: Portfolio and AI Lab are useful as coming-soon content. Disabling only the next action keeps keyboard navigation straightforward.

**Alternatives considered**: Skip disabled projects. Rejected because it creates navigation gaps and hides placeholder detail content.

## Decision: Keep detail actions placeholder-only

**Rationale**: Phase 11 establishes interaction semantics without opening real workspaces or integrations.

**Alternatives considered**: Add workspace UI or service calls. Rejected as out of scope.