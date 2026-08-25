# Contract: Project Portal Add External Project Draft Action

## User Interface Contract

- The Project Portal list includes a selectable Add External Project action before the existing focus and project rows.
- Pressing Enter or Space while Add External Project is selected creates or reselects the draft.
- After activation, `selectedProjectId` points at the draft and `selectedProjectIndex` points at the draft row in `projects`.

## State Contract

After first activation:

- `projectRegistryEntries` contains exactly one entry with the external draft id.
- `projects` contains exactly one derived project row for that draft.
- The draft row has planned status, local-only unknown repository identity, no remote repository mapping, and disabled project workspace action.
- Browser session persistence is requested through the existing save path when a browser session service is configured.

After repeated activation:

- The count of draft entries remains one.
- The count of draft project rows remains one.
- The existing draft remains selected.

## Safety Contract

The action does not:

- Read or validate local filesystem paths.
- Call GitHub or any remote provider.
- Spawn subprocesses or agent runtimes.
- Mutate a local repository, remote repository, or GitHub.
