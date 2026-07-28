# Data Model: GitHub Issue Candidate Task Mapping Foundation

## CandidateTaskPriority

Values:

- `High`
- `Medium`
- `Low`
- `Normal`

Rules:

- `bug` label -> `High`
- `enhancement` label -> `Medium`
- `documentation` label -> `Low`
- no known label -> `Normal`

## CandidateTaskType

Values:

- `Bug`
- `Feature`
- `Documentation`
- `Maintenance`
- `Research`
- `Unknown`

Representative labels:

- `bug` -> `Bug`
- `enhancement`, `feature` -> `Feature`
- `documentation`, `docs` -> `Documentation`
- `maintenance`, `chore`, `refactor`, `tech debt` -> `Maintenance`
- `research`, `investigation`, `spike` -> `Research`
- no known label -> `Unknown`

## CandidateTask

Fields:

- `id`: stable AIverse candidate task ID
- `originatingIssueId`: source issue snapshot ID
- `issueNumber`: source issue number
- `projectId`: AIverse project ID
- `title`: copied issue title
- `summary`: copied issue body summary or title fallback
- `labels`: copied issue labels
- `assignees`: copied issue assignees
- `state`: `Open` or `Closed`
- `estimatedPriority`: inferred priority
- `estimatedTaskType`: inferred task type
- `sourceProvider`: provider ID from issue sync
- `sourceRepositoryOwner`: optional repository owner
- `sourceRepositoryName`: optional repository name
- `sourceUrl`: optional issue URL
- `issueCreatedAt`: source issue creation timestamp
- `issueUpdatedAt`: source issue update timestamp
- `issueClosedAt`: optional source issue closed timestamp
- `mappedAt`: deterministic mapping timestamp, copied from issue sync metadata
- `syncedAt`: issue synchronization timestamp

Validation:

- IDs are deterministic from project ID plus issue ID.
- Labels and assignees are copied into new arrays.
- Candidate tasks are not executable tasks and have no assignee field beyond copied source issue assignees.

## CandidateTaskCollection

Fields:

- `projectId`
- `sourceProvider`
- `syncStatus`
- `tasks`
- `taskCount`
- `mappedAt`
- `sourceIssueCount`
- `sourceIssueSyncStatus`
- `sourceIssueSyncedAt`
- `errorSummary`

Rules:

- `Succeeded` issue sync maps to `Succeeded` candidate tasks.
- Empty succeeded issue sync maps to a succeeded zero-task collection.
- Non-succeeded issue sync maps to the same status with zero tasks and an honest message.
- Duplicate source issue identities produce one candidate task per unique issue identity.
