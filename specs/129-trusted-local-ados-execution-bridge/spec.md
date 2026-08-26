# Feature Specification: Trusted Local ADOS Execution Bridge

**Feature Branch**: `codex/129-trusted-local-ados-execution-bridge`

**Created**: 2026-08-25

**Status**: Draft

**Input**: User description: "Implement the missing Trusted Local ADOS Execution Bridge capability in the existing feature worktree and branch."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Start Trusted Local Implementer (Priority: P1)

A local operator can use the external project dashboard to start the approved local implementer run only after the external project has a development request draft and an ADOS run preparation record.

**Why this priority**: This is the missing bridge from prepared external ADOS state to actual local implementer execution.

**Independent Test**: Configure the external project, create the development request draft, create the ADOS preparation, activate the dashboard action again, and verify a trusted local execution result exists without validation, review, GitHub, publish, merge, or deploy side effects.

**Acceptance Scenarios**:

1. **Given** a configured external project with a draft request and prepared ADOS run, **When** the local operator activates the Project Dashboard action, **Then** the system records a trusted local implementer execution attempt for that preparation.
2. **Given** the execution bridge starts the local implementer, **When** the result is recorded, **Then** the result explicitly shows that validation, review, repository mutation, GitHub mutation, publish, merge, and deploy were not started.

---

### User Story 2 - Block Untrusted or Stale Starts (Priority: P2)

A local operator is protected from starting an external ADOS run when the preparation is missing, stale, not locally trusted, or not bound to a local worktree.

**Why this priority**: Local process execution must be auditable and least-privilege; unsafe bridge starts must be blocked before the implementer provider is invoked.

**Independent Test**: Attempt to start the bridge with no preparation, a mismatched branch/spec, or no local worktree, and verify a blocked result is recorded and no provider invocation occurs.

**Acceptance Scenarios**:

1. **Given** no prepared external ADOS run exists, **When** the dashboard action is activated, **Then** no local execution provider is invoked.
2. **Given** the prepared ADOS metadata no longer matches the trusted feature branch, spec path, or policy version, **When** the dashboard action is activated, **Then** the bridge records a blocked result.

---

### User Story 3 - Inspect Bridge Status (Priority: P3)

A local operator can inspect the external Project Dashboard and see the current bridge status alongside preparation status.

**Why this priority**: Operators need visible evidence of whether the bridge is ready, blocked, or has already attempted execution.

**Independent Test**: Render the Project Dashboard with a bridge result and verify the lower status panel shows the bridge status, worktree, branch, and side-effect boundaries.

**Acceptance Scenarios**:

1. **Given** an external ADOS execution result exists, **When** the Project Dashboard renders, **Then** it shows a compact external ADOS execution row.
2. **Given** no bridge result exists, **When** only a preparation exists, **Then** the dashboard continues to show the preparation row without an execution row.

### Edge Cases

- The local implementer provider is unavailable in the current environment.
- A previous execution result already exists for the same preparation.
- The external project has repository identity metadata but no normalized local worktree binding.
- The prepared feature branch, base SHA, spec path, reviewer command, validation command list, or execution policy version changes after preparation.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST create a trusted local ADOS execution attempt only from an existing external project ADOS preparation.
- **FR-002**: System MUST require the trusted policy metadata to match the approved branch, authoritative base SHA, spec path, validation commands, reviewer command, and policy version before invoking the local implementer.
- **FR-003**: System MUST require a normalized local worktree binding before local implementer execution can be attempted.
- **FR-004**: System MUST record blocked results for stale or unsafe bridge contexts without invoking the local implementer provider.
- **FR-005**: System MUST record implementer execution evidence from the existing local implementer provider boundary when a trusted attempt is made.
- **FR-006**: System MUST keep validation, review, repository mutation, GitHub mutation, publish, merge, and deploy flags false for this bridge.
- **FR-007**: System MUST persist trusted local ADOS execution state through browser office session save and restore.
- **FR-008**: System MUST render an external ADOS execution dashboard row when bridge state exists.

### Key Entities

- **Trusted Local ADOS Execution**: A single local implementer attempt derived from a prepared external ADOS run, including worktree, branch, policy, command evidence, status, and no-side-effect flags.
- **Trusted Local ADOS Execution Result**: The visible result for the latest bridge attempt, including reason codes and whether a local process was started.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A configured external project can progress from draft to prepared to trusted local execution attempt in three explicit dashboard activations.
- **SC-002**: 100% of blocked bridge starts record a reason code and do not invoke the local implementer provider.
- **SC-003**: 100% of bridge results preserve false validation, review, repository mutation, GitHub mutation, publish, merge, and deploy indicators.
- **SC-004**: Restored browser session state preserves the latest trusted local ADOS execution status for the external project.

## Assumptions

- The bridge starts only the local implementer step; validation and review remain separate later features.
- The local operator action in the Project Dashboard is the trust signal for the attempt.
- The existing local implementer provider remains responsible for environment-level spawn guards.
- Only the existing external project draft is in scope for this feature.
