# Quickstart: Browser Office Session Save Restore

## Prerequisites

- Feature branch: `codex/105-browser-office-session-save-restore`
- Install dependencies with `npm install` if needed.

## Validation Scenarios

1. Unit persistence:
   - Run `npm test -- BrowserOfficeSessionService`.
   - Expected: valid snapshots restore, missing or malformed snapshots are ignored, and save failures do not throw.

2. Controller integration:
   - Run `npm test -- OfficeProjectPortalController.browser-session`.
   - Expected: a restored active work snapshot hydrates a fresh controller state and duplicate starts are treated as already started.

3. Required repository validations:
   - `npm test`
   - `npx tsc --noEmit`
   - `npm run build`
   - `git diff --check`
   - `git diff --cached --check`

## Runtime Note

This ADOS runtime handoff forbids running validation commands here. The commands above are the required validation set for the next allowed runtime.
