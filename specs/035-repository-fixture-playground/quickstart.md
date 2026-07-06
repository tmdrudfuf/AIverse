# Quickstart: Repository Fixture Playground

## Prerequisites

- Node dependencies installed.
- Local repository state prepared for the active feature.

## Automated Validation

Run:

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```

Expected result:

- All commands pass.
- Tests cover deterministic fixture summaries, fresh/stale/failing/unavailable source states, Company Dashboard source signals, Project Dashboard source rows, read-only boundaries, and no external calls.

## Manual Smoke Check

Run:

```powershell
npx next dev -p 3000
```

Open:

```text
http://localhost:3000
```

Suggested flow:

1. Enter the office from the city view.
2. Approach the office computer and open the project portal.
3. Open the Company Dashboard.
4. Confirm Daily Proof shows GitHub-linked fixture source status.
5. Open the Daily Proof Project Dashboard.
6. Confirm source rows show repository name, default branch, issue summary, pull request summary, recent commit, check/build status, latest activity, and source freshness.
7. Confirm advisory rows remain local project-manager advisory/empty state and are not generated from repository fixture data.
8. Confirm no GitHub login, credential prompt, sync control, repository mutation control, task mutation, or management action appears.

Manual validation is optional for this fixture-only slice unless automated tests expose a rendering concern.
