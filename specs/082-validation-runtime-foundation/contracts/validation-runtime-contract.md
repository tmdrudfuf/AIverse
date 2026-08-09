# Validation Runtime Contract

## Start Command

Input:

- projectId
- reviewFixRuntimeId
- actor
- startedAt

Preconditions:

- actor is a human actor
- Review Fix Request, Review Fix Plan, Review Fix Runtime, and Review Fix Runtime Result are current
- Review Fix Runtime and Result are Completed and describe the same exact context
- validation command snapshot is present and safe
- repository/worktree/branch/expected HEAD bindings are present

Output:

- ValidationRuntimeOutcome with Result always present
- Runtime and RuntimeCollection only when command execution actually starts
- ResultCollection for every outcome

Forbidden side effects:

- no reviewer start
- no fresh review target
- no review promotion
- no push, PR, merge, deploy, branch deletion, or GitHub mutation
