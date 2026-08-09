# Spec 082 - Validation Runtime Foundation

**Feature Branch**: `codex/082-validation-runtime-foundation`
**Created**: 2026-08-08
**Status**: Draft
**Input**: User description: "Spec 082 - Validation Runtime Foundation"

## User Story

As the human operator, I need one explicit Validation Runtime action after a completed Review Fix Runtime so AIverse can validate the exact fixed candidate before any fresh review, promotion, publication, or GitHub mutation is possible.

## Functional Requirements

- FR-001 The Validation Runtime MUST require a current completed Review Fix Runtime and matching Review Fix Runtime Result.
- FR-002 The runtime MUST revalidate the authoritative upstream chain at command time.
- FR-003 The runtime MUST bind project, task, execution plan, review-fix request, review-fix plan, review-fix runtime, repository, worktree, branch, expected HEAD, validation command snapshot, and rules versions.
- FR-004 The runtime MUST execute only explicitly configured validation commands from the bound snapshot.
- FR-005 The runtime MUST record immutable Validation Runtime, Result, and Evidence records with deterministic project-scoped identity.
- FR-006 Runtime, Result, and Evidence MUST preserve parity for status, command count, command outcomes, timeout state, and mutation flags.
- FR-007 The runtime MUST block before command execution when context is stale, mismatched, malformed, unsafe, or incomplete.
- FR-008 Command execution MUST be bounded by configured timeouts and MUST record command failures without starting review or repository publication.
- FR-009 The runtime MUST remain provider-neutral and project-neutral.
- FR-010 The dashboard and input state MUST truthfully show unavailable, ready, blocked, failed, timed-out, and completed states.
- FR-011 The runtime MUST require a distinct explicit human action.
- FR-012 The runtime MUST NOT automatically start Claude review, create a fresh Review Target, promote a review, push, create/update PRs, merge, deploy, or mutate GitHub.

## Success Criteria

- SC-001 A current completed Review Fix Runtime can be validated through exactly the configured command snapshot.
- SC-002 Stale or mismatched upstream records block before any command provider is invoked.
- SC-003 Nonzero command exit and timeout results are recorded as immutable evidence.
- SC-004 The dashboard exposes the Validation Runtime state without implying review or publication has started.
