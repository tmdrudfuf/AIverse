# Quickstart: Controlled Autonomous Backlog Execution Policy

## Targeted Validation

Run targeted tests for this feature:

```powershell
npx vitest run src/features/city-view/scene/office/project-backlog/ProjectAutonomousExecutionPolicyService.test.ts src/features/city-view/scene/office/OfficeProjectPortalController.project-autonomy.test.ts src/features/city-view/scene/office/browser-session/BrowserOfficeSessionService.test.ts src/features/city-view/scene/PortfolioOperationsService.test.ts
```

## Runtime Evidence Scenario

Use safe disposable/test projects rather than recursively targeting AIverse itself.

1. Create or load Project A and Project B.
2. Add a high-priority Ready task to Project A with valid title and description.
3. Add an urgent Ready task to Project B.
4. Enable autonomy for Project A with high allowed.
5. Leave Project B autonomy off.
6. Trigger autonomous reevaluation for Project A.
7. Verify Project A selects the deterministic task and starts through the existing Spec 142 bridge.
8. Verify task/request/preparation/run association exists.
9. Verify the task moves to In Progress only after execution acceptance.
10. Verify live office visualization reflects the real Project A run.
11. Switch to Project B and verify autonomy is off and its Ready task remains Ready.
12. Reload and verify Project A does not duplicate execution.
13. Disable Project A autonomy while its run is active and verify the run continues.
14. Verify no new Project A task auto-starts afterward.
