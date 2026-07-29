# Contract: Candidate ProjectTask Promotion

## Promotion Command

Input:

```text
projectId
candidateTaskId
requestedAt
```

Required current state:

- Candidate Task collection for `projectId`
- Assignment recommendation collection for `projectId`
- Promotion decision records
- ProjectTask collection for `projectId`

Output:

```text
CandidateProjectTaskPromotionResult
Updated TaskCollection when status = Promoted. `AlreadyPromoted` may include an unchanged copied TaskCollection for diagnostics/idempotency; callers must not apply it as a mutation.
```

## Status Contract

- `Promoted`: one new ProjectTask was created.
- `AlreadyPromoted`: matching ProjectTask already existed; no duplicate was created.
- `Rejected`: current human decision is not Approved.
- `Ineligible`: current Candidate Task, decision, recommendation, or provenance blocks promotion.
- `Unavailable`: required source collection is unavailable.
- `Failed`: unexpected local mapping/store failure; no partial task should be created.

## Safety Contract

The command must not:

- call GitHub
- mutate Candidate Tasks
- mutate assignment recommendations
- mutate promotion decisions
- mutate employee state
- create work sessions
- invoke Codex or Claude at runtime
- start task execution
- assign employees
- change existing ProjectTasks
