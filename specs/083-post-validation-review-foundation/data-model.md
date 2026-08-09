# Data Model: Spec 083

## Post-Validation ReviewTarget

An existing `ReviewTarget` with `source: "PostValidation"` and additional linkage fields to Review Fix Request, Review Fix Plan, Review Fix Runtime/Result, Validation Runtime/Result, validation command snapshot, validation evidence summary, and validation rules versions.

## Reviewer Runtime

The existing Reviewer Runtime. Its `reviewTargetId` and evidence `reviewTargetSha` must match the fresh post-validation target.

## Review Decision

The existing derived decision classification, updated to select reviewer runtime/result records by the current target ID when a target is supplied.
