# Quickstart: Controlled Autonomous Suggestion Generation Policy

## Targeted Verification

Run targeted Vitest coverage after implementation:

```powershell
npx vitest run src/features/city-view/scene/office/project-backlog/ProjectAutonomousSuggestionPolicyService.test.ts src/features/city-view/scene/office/OfficeProjectPortalController.project-backlog-suggestions.test.ts src/features/city-view/scene/office/browser-session/BrowserOfficeSessionService.test.ts src/features/city-view/scene/PortfolioOperationsService.test.ts
```

Run diff whitespace checks:

```powershell
git diff --check
git diff --cached --check
```

## Runtime Evidence Scenario

Document evidence in repository-relative files under `specs/147-controlled-autonomous-suggestion-generation-policy/`:

- Project A defaults Off, is explicitly enabled, and can generate one proposed suggestion through the existing Spec 143 service.
- Project B remains Off and receives no automatic suggestion.
- Immediate repeated evaluation is blocked by idempotency or cooldown.
- Pending suggestion, active execution, and Ready work each block generation.
- Reload preserves policy and cooldown.
- Manual Spec 143 generation remains functional.
- No Spec 145, Spec 146, Spec 144, Spec 142, ADOS, Git, or GitHub mutation occurs.
