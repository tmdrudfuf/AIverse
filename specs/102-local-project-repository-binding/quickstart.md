# Quickstart: Local Project Repository Binding

## Focused Scenario

Create portal state with a Daily Proof binding:

```ts
const state = createProjectPortalState({
  localRepositoryBindings: [
    {
      projectId: "daily-proof",
      repositoryPath: "C:/Users/tmdru/Desktop/Ky-Project/AIverse",
      worktreePath: "C:/Users/tmdru/Desktop/Ky-Project/AIverse-local-project-repository-binding",
      branchName: "codex/102-local-project-repository-binding",
      specPath: "specs/102-local-project-repository-binding/spec.md",
      source: "ados-handoff",
      boundAt: "2026-08-15T00:00:00.000Z",
    },
  ],
});
```

Expected outcome:

- `state.projectRegistryEntries` contains Daily Proof with `localRepositoryBinding`.
- `state.projects` contains Daily Proof with the same configured binding metadata.
- `repositoryIdentity.localPath` is the configured worktree path.
- Repository synchronization is not treated as verified success merely because a binding exists.

## Validation Commands

Run outside this ADOS runtime:

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```
