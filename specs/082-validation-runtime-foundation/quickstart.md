# Quickstart: Spec 082

1. Reach a completed Review Fix Runtime for the selected project task.
2. Press the distinct Validation Runtime input.
3. Confirm the dashboard row reports Validation Runtime as Completed, Failed, Timed Out, or Blocked.
4. Confirm no reviewer, review target, promotion, GitHub, PR, merge, or deployment state changed.

Real local command execution requires explicit process opt-in:

```powershell
$env:AIVERSE_ALLOW_VALIDATION_RUNTIME_SPAWN='1'
```
