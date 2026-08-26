# Data Model: External Project ADOS Run Status

## ExternalProjectAdosRunStatus

**Purpose**: Current read-only summary of an external project ADOS run.

**Fields**:

- `id`: Canonical status id for the project and rules version.
- `projectId`: External project id.
- `stage`: Current stage: `NotPrepared`, `Prepared`, `Started`, `Completed`, `Blocked`, `Failed`, `TimedOut`, or `Cancelled`.
- `status`: User-facing status inherited from preparation or execution evidence.
- `source`: Evidence source: `preparation`, `execution`, or `result`.
- `preparationId`: Preparation id when available.
- `executionId`: Execution id when available.
- `reasonCodes`: Latest reason codes from execution result evidence.
- `featureBranch`: Feature branch when available.
- `worktreePath`: Worktree path when available.
- `updatedAt`: Timestamp from the latest source evidence.
- `validationStarted`, `reviewStarted`, `repositoryMutationStarted`, `githubMutationStarted`, `publishStarted`, `mergeStarted`, `deployStarted`: Always false.
- `rulesVersion`: Status rules version.

**Relationships**:

- Belongs to one external project.
- References one ADOS preparation when available.
- References one ADOS execution when available.
- References the latest ADOS execution result when available.

**Validation Rules**:

- A status without preparation, execution, or result evidence is not created.
- Blocked and failed statuses must include at least one reason code.
- Downstream side-effect flags must remain false.

## State Transitions

```text
No status -> Prepared -> Started -> Completed
No status -> Prepared -> Blocked
No status -> Prepared -> Failed
No status -> Prepared -> TimedOut
No status -> Prepared -> Cancelled
```

Status is derived from the latest available local evidence; rendering does not trigger transitions.
