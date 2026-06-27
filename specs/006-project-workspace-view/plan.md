# Implementation Plan: Project Workspace View

## Technical Approach
Extend the existing office Project Portal boundary. Add a workspace view mode, static Daily Proof workspace data, workspace section selection state, and render the workspace inside the existing Phaser overlay.

## Files
- OfficeProjectPortalTypes.ts: workspace model and state additions.
- OfficeProjectPortalRegistry.ts: Daily Proof workspace static data.
- OfficeProjectPortalController.ts: detail-to-workspace navigation and workspace input handling.
- OfficeProjectPortalView.ts: workspace rendering.

## Validation
Run npx tsc --noEmit, npm run build, and git diff --check. Manually verify portal navigation and disabled workspace section behavior.