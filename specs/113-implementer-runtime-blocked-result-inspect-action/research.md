# Research: Implementer Runtime Blocked Result Inspect Action

## Decision: Use the existing Implementer Runtime row wording surface

**Rationale**: Timed-out and failed Implementer Runtime outcomes already communicate inspection through compact row text. A blocked result needs the same immediate next-action cue without adding a new dashboard row or interaction path.

**Alternatives considered**: Add a new result-detail panel or keyboard handler. Both exceed the feature's described scope and would require broader portal state and input changes.

## Decision: Preserve non-blocked outcome wording

**Rationale**: Completed, timed-out, cancelled, failed, unavailable, and ready rows already carry established lifecycle and safety wording. The request targets blocked results only.

**Alternatives considered**: Normalize all outcome rows around a new inspect vocabulary. That would be broader than necessary and could disrupt previous wording guarantees.

## Decision: Keep safety wording in the blocked row

**Rationale**: Implementer Runtime rows must continue to make clear that Codex/reviewer, validation, and mutation work has not started from this stage.

**Alternatives considered**: Replace safety wording with a longer requirement-resolution explanation. That risks wrapping and losing the most important next-action cue.
