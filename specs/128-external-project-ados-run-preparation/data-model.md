# Data Model: External Project ADOS Run Preparation

## External Project ADOS Run Preparation

| Field | Required | Description |
|-------|----------|-------------|
| `id` | Yes | Stable preparation identifier for the project. |
| `projectId` | Yes | External project draft id. |
| `developmentRequestDraftId` | Yes | Development request draft this preparation is based on. |
| `status` | Yes | Preparation lifecycle status; this slice records `Prepared`. |
| `featureBranch` | Yes | Feature branch named by the ADOS handoff. |
| `authoritativeBaseSha` | Yes | Base commit SHA named by the ADOS handoff. |
| `specPath` | Yes | Spec Kit path for the feature being prepared. |
| `validationCommands` | Yes | Required validation commands for a later validation runtime. |
| `reviewerCommand` | Yes | Reviewer command label for later review. |
| `executionPolicyVersion` | Yes | Handoff execution policy version. |
| `createdAt` | Yes | Time the preparation was first created. |
| `updatedAt` | Yes | Time the preparation was last reused or refreshed. |
| `sideEffectBoundary` | Yes | Human-readable boundary stating that no run, validation, review, repository, GitHub, publish, merge, or deploy side effects have started. |

## State Transitions

- Missing -> Prepared: allowed only when the external project has a development request draft.
- Prepared -> Prepared: repeated creation attempts reuse the existing preparation and refresh `updatedAt`.
- Prepared -> Runtime/Validation/Review: out of scope for this feature.
