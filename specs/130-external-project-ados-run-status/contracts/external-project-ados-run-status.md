# Contract: External Project ADOS Run Status

## Dashboard Row Contract

When any external ADOS run state exists for a project, the Project Dashboard lower panel exposes one row with the marker:

```text
[ADOS STATUS]
```

The row includes:

- Current stage and status.
- Feature branch when known.
- Worktree or preparation context when known.
- Latest reason code when present.
- A side-effect boundary stating validation, review, repository mutation, GitHub mutation, publish, merge, and deploy were not started by status inspection.

## Persistence Contract

Browser office session snapshots may include:

```text
externalProjectAdosRunStatuses
```

The value is a project-id keyed record of ADOS run status summaries. Restore accepts the record only when it is object-shaped; rendering still derives the visible row from preparation, execution, and result evidence if persisted status is absent or stale.
