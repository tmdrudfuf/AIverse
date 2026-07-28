# Contract: Candidate Task Mapping

## Input

`CandidateTaskMapper.mapIssueCollection(projectId, issueCollection)`

- `projectId`: AIverse project ID.
- `issueCollection`: provider-neutral `IssueSnapshotCollection` from Spec 062.

The mapper must not call any provider or mutate the input collection.

## Output

`CandidateTaskCollection`

Required behavior:

- One candidate task per unique issue snapshot when `issueCollection.syncStatus === "Succeeded"`.
- Zero candidate tasks for `NotStarted`, `Syncing`, `Failed`, or `Unavailable`.
- Stable IDs and deterministic inference for repeated mapping over equivalent inputs.
- Defensive copies for task arrays and nested label/assignee arrays.

## Inference Contract

Priority:

- `bug`: `High`
- `enhancement`: `Medium`
- `documentation` or `docs`: `Low`
- otherwise: `Normal`

Task type:

- `bug`: `Bug`
- `enhancement` or `feature`: `Feature`
- `documentation` or `docs`: `Documentation`
- `maintenance`, `chore`, `refactor`, `tech debt`, or `technical debt`: `Maintenance`
- `research`, `investigation`, or `spike`: `Research`
- otherwise: `Unknown`

Label matching is case-insensitive and trims whitespace.
