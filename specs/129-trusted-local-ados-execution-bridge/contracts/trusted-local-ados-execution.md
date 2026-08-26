# Contract: Trusted Local ADOS Execution

## Trigger

Project Dashboard action for the external project after a development request draft and ADOS preparation exist.

## Preconditions

- Selected dashboard project is the external project draft.
- External project development request draft exists.
- External project ADOS run preparation exists.
- External project has a normalized local repository binding with repository path and worktree path.
- Preparation metadata matches the approved Spec 129 execution policy.

## Outputs

### Trusted Result

The controller stores a trusted local ADOS execution result under the selected external project id. When the provider reports a completed or timed-out attempt, the controller also stores the execution record.

### Blocked Result

When a precondition fails after preparation exists, the controller stores a blocked result with a reason code and does not invoke the provider.

## Side-Effect Boundary

The bridge may attempt only the local implementer provider boundary. It must not start validation, review, repository mutation, GitHub mutation, publish, merge, or deploy.
