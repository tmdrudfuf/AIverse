# Contract: External Project ADOS Run Preparation

## Dashboard Action Contract

When the selected Project Dashboard project is the configured external project:

1. If repository identity is unknown, the action opens repository identity edit.
2. If no development request draft exists, the action creates the development request draft.
3. If a development request draft exists, the action creates or reuses one ADOS run preparation.
4. The action stays in Project Dashboard and does not start validation, review, runtime, repository sync, issue sync, publish, merge, deploy, repository mutation, or GitHub mutation.

## Preparation Display Contract

The Project Dashboard lower panel shows a row labeled `ADOS PREP` after preparation exists. The row includes:

- preparation status
- feature branch
- short base SHA
- spec path
- validation command count
- reviewer command
- side-effect boundary

## Persistence Contract

Browser office session save/restore preserves all preparation records keyed by project id and restores them without changing runtime, validation, review, repository, GitHub, task, employee, or project registry state.
