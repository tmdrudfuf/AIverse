# Contract: Review Fix Plan

## Command

```text
Plan review fixes
```

Inputs:

- selected project ID
- current Review Fix Request ID
- human actor label
- command timestamp
- current per-project portal state

## Valid Outcomes

```text
Planned
AlreadyPlanned
Blocked
Failed
```

## Required Command-Time Order

```text
human actor validation
        ↓
Review Fix Request command-time revalidation
        ↓
exact current request comparison
        ↓
Review Fix Plan creation or idempotent result
```

## Successful Plan Guarantees

- deterministic Review Fix Plan ID
- immutable plan snapshot
- immutable result snapshot
- exact binding to the current Review Fix Request and review runtime chain
- no duplicated plan on repeat input
- no source record mutation
- no Validation Runtime start
- no Codex or Claude invocation
- no subprocess execution
- no validation command execution
- no repository mutation
- no GitHub mutation

## Dashboard Contract

The dashboard may show:

```text
[REVIEW FIX PLAN]
Plan fixes (G); no execution
Fix plan recorded
No fix execution started
No Validation Runtime
```

The dashboard must not claim:

```text
Fixes Running
Codex Running
Claude Running
Validation Running
Repository Changing
GitHub Updating
```
