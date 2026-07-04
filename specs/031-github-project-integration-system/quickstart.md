# Quickstart: GitHub Project Integration System

## Purpose

Validate the first read-only GitHub project integration vertical slice after implementation.

## Prerequisites

- Required product/security decisions are approved.
- A local branch contains the GitHub Project Integration implementation.
- A test AIverse project has a configured GitHub repository mapping according to the approved repository selection flow.

## Automated Validation

Run:

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```

## Manual Validation

1. Start the app:

   ```powershell
   npx next dev -p 3000
   ```

2. Open:

   ```text
   http://localhost:3000
   ```

3. Enter the office and open the computer/project portal.

4. Open Company Dashboard.

5. Open a Project Dashboard for a project with no repository mapping.

   Expected:
   - Internal simulation still displays.
   - GitHub source data is not fabricated.
   - No GitHub mutation controls appear.

6. Open a Project Dashboard for a project with a configured GitHub repository mapping.

   Expected read-only information, where available:
   - repository identity
   - owner/name
   - default branch
   - repository URL metadata
   - provider/source status
   - sync freshness
   - open issue summary
   - open pull request summary
   - recent commit summary
   - latest activity timestamp
   - build/check status summary

7. Validate failure states according to the approved implementation:

   - unavailable repository
   - unauthorized/private repository behavior
   - stale data
   - rate-limited data
   - offline/unreachable source

8. Confirm read-only boundaries:

   - no issue creation
   - no PR creation
   - no branch creation
   - no commit action
   - no merge action
   - no GitHub Actions modification
   - no webhook setup
   - no AI employee autonomous code modification
   - no internal simulation mutation caused by GitHub refresh

## Expected Result

Manual validation passes when GitHub repository information appears as read-only provider-neutral Project Dashboard context, internal simulation remains authoritative, and all source failure states are explicit and non-blocking.
