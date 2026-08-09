# Research: Spec 083

## Decision 1: Extend ReviewTarget

**Decision**: Reuse `ReviewTarget` with a source mode instead of creating a parallel reviewer target.

**Rationale**: Reviewer Runtime already consumes `ReviewTarget` safely and records `reviewTargetSha` in evidence. A post-validation mode keeps the provider-neutral reviewer boundary while making the target semantics explicit.

## Decision 2: Separate Prepare and Start Actions

**Decision**: Use separate explicit human actions for target preparation and re-review start.

**Rationale**: Validation completion must not spawn a reviewer, and target resolution must be inspectable before execution.

## Decision 3: Exact SHA From Validation Evidence

**Decision**: Use `ValidationRuntime.expectedHead` / evidence `expectedHead` as the exact target SHA and reject mismatches.

**Rationale**: Validation Runtime is the authoritative post-fix validation record. A changed worktree HEAD requires fresh validation.
