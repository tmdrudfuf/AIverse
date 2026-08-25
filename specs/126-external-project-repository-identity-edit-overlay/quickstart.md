# Quickstart: External Project Repository Identity Edit Overlay

## Scenario 1: Apply Local AIverse Worktree Identity

1. Start from a portal state with the external project draft selected.
2. Open the draft project dashboard.
3. Activate the dashboard action to open the repository identity edit overlay.
4. Keep or select the local AIverse worktree choice.
5. Press Enter or Space.

Expected outcome: The portal returns to the project dashboard. The external project draft has a configured local repository identity, a connected local repository label, and no GitHub mutation or repository verification occurs.

## Scenario 2: Cancel Without Mutation

1. Open the repository identity edit overlay for the external project draft.
2. Move between choices.
3. Press Esc.

Expected outcome: The portal returns to the project dashboard and the draft repository identity is unchanged.

## Scenario 3: Restore Edited Identity

1. Apply an identity choice to the external project draft.
2. Restore browser office session state into a fresh portal state.

Expected outcome: The restored draft registry entry and derived portal project retain the edited repository identity and local repository label.

## Commands

Focused validation is intentionally outside this ADOS runtime:

```powershell
npx vitest run src/features/city-view/scene/office/OfficeProjectPortalController.project-dashboard.test.ts src/features/city-view/scene/office/OfficeProjectPortalRegistry.test.ts src/features/city-view/scene/office/OfficeProjectPortalView.test.ts
```
