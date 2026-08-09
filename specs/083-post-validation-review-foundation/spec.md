# Spec 083 - Post-Validation Review Target and Re-Review Foundation

**Feature Branch**: `codex/083-post-validation-review-foundation`
**Created**: 2026-08-08
**Status**: Draft
**Input**: User description: "Spec 083 - Post-Validation Review Target and Re-Review Foundation"

## User Story

As the human operator, I need a fresh independent re-review to bind only to the exact post-fix candidate that successfully completed Validation Runtime, so stale pre-fix review evidence can never be reused after fixes.

## Functional Requirements

- FR-001 A completed Validation Runtime and coherent Validation Runtime Result MUST be the prerequisite for a fresh post-validation review target.
- FR-002 The post-validation target MUST bind project, task, execution plan, review-fix request, review-fix plan, review-fix runtime/result, validation runtime/result, repository, worktree, branch, base branch/SHA, merge-base SHA, exact validated SHA, validation command snapshot, validation evidence, and rules versions.
- FR-003 The target MUST block when Validation Runtime is missing, blocked, failed, timed out, stale, mismatched, or validated against another SHA.
- FR-004 The target MUST not reuse the original pre-fix Review Target as the post-validation target.
- FR-005 Re-review MUST require a distinct explicit human action after the target exists.
- FR-006 Re-review MUST reuse the provider-neutral Reviewer Runtime boundary and pass the exact fresh target SHA to reviewer evidence.
- FR-007 Rendering, refresh, validation completion, persistence, and target resolution MUST NOT automatically spawn a reviewer.
- FR-008 Review Decision MUST evaluate the reviewer runtime that matches the current fresh target.
- FR-009 No automatic promotion, new fix request, fix loop, push, PR, merge, deploy, or GitHub mutation may occur in product runtime.
- FR-010 Records and collections MUST be deterministic, immutable/copy-safe, and project-scoped.

## Success Criteria

- SC-001 A completed Validation Runtime creates a fresh target with a target ID distinct from the original pre-fix target.
- SC-002 SHA drift after Validation Runtime blocks target resolution before re-review.
- SC-003 The Reviewer Runtime receives the exact fresh target SHA.
- SC-004 Historical reviewer results for old targets do not mask the current post-validation reviewer result.
