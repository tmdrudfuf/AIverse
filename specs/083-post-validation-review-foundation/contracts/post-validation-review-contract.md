# Post-Validation Review Contract

## Prepare Target

Input:

- projectId
- validationRuntimeId
- actor
- requestedAt

Output:

- ReviewTarget when Validation Runtime is completed and exact-context coherent
- blocked result otherwise

## Start Re-Review

Input:

- projectId
- post-validation review target
- actor
- requestedAt

Behavior:

- invokes existing Reviewer Runtime provider boundary
- passes exact fresh target SHA
- records Reviewer Runtime/Result
- does not promote, publish, push, PR, merge, deploy, or mutate GitHub
