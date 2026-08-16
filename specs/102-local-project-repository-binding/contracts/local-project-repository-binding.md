# Contract: Local Project Repository Binding

## Operation

```ts
applyLocalProjectRepositoryBindings(
  entries: ReadonlyArray<ProjectRegistryEntry>,
  bindings: ReadonlyArray<LocalProjectRepositoryBinding>,
): LocalProjectRepositoryBindingApplication
```

## Success

A successful binding:

- targets an existing `ProjectRegistryEntry.id`;
- includes at least one non-empty local path;
- returns `status: "Bound"`;
- returns copied entries with one matching entry updated;
- does not mutate the input `entries` or `bindings`.

## Rejection

Rejected bindings:

- return `status: "Rejected"`;
- include `reason: "UnknownProject"` when no entry matches;
- include `reason: "MissingLocalPath"` when both paths are blank or absent;
- leave all returned entries identical to the pre-attempt state.

## Safety Boundary

The operation must not:

- read the filesystem;
- spawn subprocesses;
- invoke `git`, `gh`, or GitHub APIs;
- infer path existence;
- mutate any repository or remote system.
