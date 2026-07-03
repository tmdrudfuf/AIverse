# Quickstart: Project Dashboard System

## Purpose

Validate the read-only Project Dashboard vertical slice from the Company Dashboard flow.

## Prerequisites

- Use a local branch with the Project Dashboard implementation.
- Install dependencies if needed.
- Ensure the app has at least one internal simulation project available through the Company Dashboard.

## Automated Validation

Run:

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```

All commands must pass before the feature is considered complete.

## Manual Validation

1. Start the app:

   ```powershell
   npx next dev -p 3000
   ```

2. Open:

   ```text
   http://localhost:3000
   ```

3. Enter the office flow that contains the project portal/computer interaction.

4. Verify existing behavior:

   - City renders.
   - Office renders.
   - Player movement works.
   - Computer interaction target is visible and usable.
   - Project portal opens.
   - Company Dashboard opens.
   - Company Influence focus, if present, still displays correctly.

5. Open one Project Dashboard from a Company Dashboard project entry.

6. Verify the Project Dashboard shows read-only project detail:

   - project name
   - project status
   - progress
   - active tasks or an empty active-work state
   - assigned or related employees, when available
   - current blockers or a neutral no-blocker state
   - recent project activity, when available
   - related employee focus or AI state, when available
   - project health
   - advisory next suggested focus, when available

7. Verify navigation:

   - Return from Project Dashboard to Company Dashboard.
   - Reopen the same project.
   - Open another project if multiple projects are available.
   - Close the dashboard/portal using the existing controls.

8. Verify read-only boundaries:

   - No task assignment control appears.
   - No task edit control appears.
   - No task status mutation control appears.
   - No issue creation control appears.
   - No GitHub connection or sync control appears.
   - No dialogue choice appears.
   - No management, economy, payroll, relationship, quest, multiplayer, or save/load control appears.

9. Verify simulation remains unchanged:

   - Employee Insight and Employee Knowledge still work.
   - Office movement and controls still work.
   - Project portal/dashboard still work.
   - Opening/closing Project Dashboard does not directly mutate employees, tasks, schedules, work sessions, company focus, NPC movement, or project execution.

## Expected Result

Manual validation passes when the player can inspect one project in detail from the Company Dashboard, return safely, and observe no direct simulation mutation or management affordance.

## Failure Reporting

If manual validation fails, report:

- failed step
- expected behavior
- actual behavior
- whether the issue blocks the read-only Project Dashboard flow
