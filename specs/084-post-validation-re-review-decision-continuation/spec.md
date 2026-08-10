# Spec 084 - Post-Validation Re-Review Decision and Continuation Foundation

**Feature Branch**: `codex/084-post-validation-re-review-decision-continuation`
**Created**: 2026-08-09
**Status**: Draft
**Input**: User description: "Post-Validation Re-Review Decision & Continuation Foundation"

## User Story

As the human operator, I need the decision after a post-validation re-review to be evaluated against the fresh post-validation target, so approval and any further fix continuation cannot accidentally reuse the pre-fix review evidence.

## Functional Requirements

- FR-001 Review Decision MUST classify the reviewer runtime/result that matches the active post-validation review target after re-review starts.
- FR-002 A post-validation Approved re-review MUST allow the existing human Promote action to record an immutable Review Promotion for the post-validation reviewer runtime only.
- FR-003 A post-validation ChangesRequested re-review MUST allow the existing human Request Fix action to record a new Review Fix Request for the post-validation reviewer runtime only.
- FR-004 Historical pre-validation reviewer results, promotions, fix requests, fix plans, fix runtimes, validation runtimes, and post-validation targets MUST remain immutable and MUST NOT be rewritten to represent the continuation decision.
- FR-005 Continuation MUST remain explicit human action only; render, refresh, validation completion, target preparation, and re-review completion MUST NOT automatically promote, request fixes, plan fixes, run fixes, validate, publish, merge, deploy, push, open a PR, or mutate GitHub.
- FR-006 Records and results MUST retain safety flags proving no repository, GitHub, publication, merge, deployment, or validation side effects were started by decision/continuation recording.
- FR-007 Dashboard and controller decision resolution MUST use the same selected candidate/task scoped current execution plan and the same active review target.

## Success Criteria

- SC-001 After an Approved post-validation re-review, pressing Promote creates exactly one Review Promotion whose reviewerRuntimeId and reviewTargetId match the post-validation re-review runtime/target.
- SC-002 After a ChangesRequested post-validation re-review, pressing Request Fix creates a new Review Fix Request whose reviewerRuntimeId and reviewTargetId match the post-validation re-review runtime/target, while the pre-validation fix request remains unchanged.
- SC-003 Re-review completion alone does not create a promotion or a new fix request.
- SC-004 Focused regression coverage proves old pre-validation reviewer results do not drive the post-validation continuation decision.
