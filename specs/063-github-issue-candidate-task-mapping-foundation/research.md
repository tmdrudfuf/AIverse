# Research: GitHub Issue Candidate Task Mapping Foundation

## Decision: Candidate Tasks are a separate domain projection

**Rationale**: Existing `ProjectTask` values represent executable work with status, assignee, activity, and future employee actions. Spec 063 must not assign or execute work. A separate Candidate Task model prevents UI and future services from confusing mapped issues with active work.

**Alternatives considered**:

- Reuse `ProjectTask`: rejected because it implies assignment/execution semantics.
- Add fields directly onto `IssueSnapshot`: rejected because issue sync must remain a provider-neutral read snapshot.

## Decision: Mapping runs from synchronized issue collections only

**Rationale**: Spec 062 already owns provider reads, error handling, and concurrency. Candidate mapping should be deterministic and local.

**Alternatives considered**:

- Mapper calls GitHub directly: rejected because it duplicates issue sync and violates scope.
- Mapper accepts raw GitHub issues: rejected because it couples this layer to one provider.

## Decision: Deterministic label inference is isolated in the mapper

**Rationale**: Priority and type inference will evolve as more providers arrive. Keeping rules in the mapper avoids controller/view conditionals and makes tests exhaustive.

**Alternatives considered**:

- Infer in controller: rejected because controller should orchestrate state, not own domain rules.
- Infer in view: rejected because rendering should not change task semantics.

## Decision: Candidate task collections mirror issue sync availability

**Rationale**: When issue sync is unavailable, failed, syncing, or not started, there are no reliable issue snapshots to map. The candidate layer should show honest unavailable/pending states rather than fabricated empty success.

**Alternatives considered**:

- Always return an empty succeeded collection: rejected because it conflates no issues with unavailable issue sync.
