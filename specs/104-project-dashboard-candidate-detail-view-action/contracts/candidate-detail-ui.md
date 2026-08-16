# Contract: Candidate Detail UI

## Purpose

Define the player-facing candidate detail behavior expected from the Project Dashboard candidate detail action.

## Preconditions

- The Project Dashboard is open for one selected project.
- A candidate task collection is loaded for that project.
- A selected candidate task can be resolved from the selected promotion review or visible candidate task data.

## Candidate Detail Action

- C/detail opens the candidate detail view for the selected candidate task.
- Enter remains reserved for the existing candidate approval/progression flow on the Project Dashboard.
- Space remains reserved for the existing promotion decision cycle on the Project Dashboard.
- If no selected candidate can be resolved, the action leaves the player on the Project Dashboard.

## Candidate Detail Content

Candidate detail should show:

- candidate title
- issue number and issue state
- candidate priority and type
- source provider and repository when known
- labels and assignees when present
- summary
- assignment recommendation context when present
- promotion review context when present
- promoted project task context when present

## Read-Only Guarantees

Opening, viewing, and leaving candidate detail must not:

- create ProjectTasks
- assign employees
- record promotion decisions
- prepare or start work sessions
- create execution plans or runtime records
- start implementer, reviewer, validation, or post-validation review runtimes
- mutate repositories or GitHub
- publish, merge, or deploy
