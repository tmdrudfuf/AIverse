# Data Model: In-Office Development Request

## Development Request

- `id`: Stable project/request identifier.
- `projectId`: Registered target project id.
- `projectName`: Display name of the registered project.
- `companyName`: Active office company display name.
- `status`: `Draft`, `Preparing`, `Prepared`, `Submitting`, `Started`, `AlreadyActive`, `Blocked`, `Failed`, or `Completed`.
- `title`: Short display title derived from the request.
- `requestText`: Full user-entered request text.
- `requirementsArtifactPath`: Durable request-bound requirements path.
- `requirementsArtifactContent`: Full authoritative requirements content.
- `adosRunId`: Associated ADOS execution id once accepted.
- `createdAt` / `updatedAt`: Stable audit timestamps.

## ADOS Run Preparation

- `id`: Stable preparation id for project/request.
- `projectId`: Registered target project id.
- `developmentRequestDraftId`: Request identity.
- `featureId`: Deterministic ADOS feature id for the target project.
- `featureBranch`: Target feature branch.
- `specPath`: Target project spec path.
- `requirementsFilePath`: Durable requirements artifact path.
- `requirementsPreview`: Bounded preview of full requirements content.
- `status`: `Prepared`.

## ADOS Execution

- `id`: Stable run id derived from project and preparation.
- `projectId`: Registered target project id.
- `preparationId`: Preparation identity.
- `developmentRequestDraftId`: Request identity.
- `featureId`, `featureBranch`, `specPath`, `requirementsFilePath`: Run identity and authoritative requirements references.
- `status`: Trusted runtime outcome.
- `evidence`: Provider evidence for accepted/blocked/failed launch.

## State Transitions

Draft -> Prepared -> Submitting -> Started/AlreadyActive/Blocked/Failed -> Completed.

Duplicate submissions reuse the existing prepared/execution identity instead of creating another run.
