# Quickstart: GitHub Read Integration Preflight

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
- Tests prove the public read boundary remains summary-level.
- Tests prove fixture provider output remains compatible with dashboard providers.
- Tests prove display-safe unavailable/rate-limited/offline/error states map correctly.
- Tests prove no real `fetch`, auth, sync, persistence, repository mutation, or advisory mutation behavior was introduced.

## Manual Validation

Manual browser validation is not required for this preflight slice because it does not add UI, a real provider, or player-facing behavior.

## Review Checklist

Before opening a PR, confirm:

- No real GitHub provider implementation exists.
- No `fetch` or external network code exists in the diff.
- No credential/token/auth strings or storage paths exist in the diff.
- No dashboard UI redesign exists.
- No repository/task/project/employee/advisory mutation behavior exists.
- Existing fixture-backed dashboard tests still pass.
