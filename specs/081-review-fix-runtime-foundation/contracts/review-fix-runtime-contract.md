# Contract: Review Fix Runtime

## Input Contract

The controller may call the Review Fix Runtime service only when a distinct `startReviewFixRuntimePressed` input is present. The command must include:

- current `projectId`
- current `reviewFixPlanId`
- explicit human `actor`
- command timestamp

The action is not inferred from dashboard render, refresh, request creation, plan creation, reviewer results, timers, polling, automation, or labels.

## Preflight Contract

Before provider invocation the service must prove:

- actor is a valid human actor
- project/task/execution/review context is current
- current review decision classifies as `ChangesRequested`
- current Review Fix Request is present and revalidated
- current Review Fix Plan is present and revalidated
- plan/request/decision/runtime-chain IDs and snapshot fields match exactly
- project, repository, worktree, branch, target SHA, expected HEAD, provider roles, mutation scope, rules versions, and validation-command snapshot match
- command configuration is safe
- no incompatible active/current runtime exists

Any failed preflight blocks before spawn.

## Provider Contract

Provider invocation is bounded to the local fix-runtime attempt. Product code must not authorize:

- push
- GitHub API mutation
- PR create/update
- Ready for Review
- merge
- branch or remote-branch deletion
- deploy
- automatic Validation Runtime
- automatic Reviewer Runtime
- automatic promotion

## Output Contract

The service returns immutable collections and a latest result. Runtime and result status must be coherent:

- completed provider attempt records a completed runtime and completed result
- timeout records timed-out runtime/result evidence where supported
- preflight block records a blocked result without provider execution evidence
- provider failure records failed result/runtime evidence according to existing runtime conventions
- repeated exact completed start returns an idempotent result only after actor/current-context revalidation

## Dashboard Contract

The dashboard row communicates Review Fix Runtime state truthfully and must distinguish:

- ready for explicit runtime start
- blocked
- running/started where represented
- completed
- failed/timed out
- validation has not run
- re-review has not run
