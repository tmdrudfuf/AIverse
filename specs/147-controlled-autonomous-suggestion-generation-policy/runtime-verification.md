# Runtime Verification: Controlled Autonomous Suggestion Generation Policy

**Date**: 2026-09-02

**Evidence Path**: `specs/147-controlled-autonomous-suggestion-generation-policy/runtime-evidence.json`

## Scenario

Targeted runtime verification used two registered project contexts:

- Project A: `project-a`
- Project B: `project-b`

The scenario was executed through deterministic Vitest coverage using the existing office portal controller, browser session service, portfolio derivation, and Spec 143 `ProjectBacklogSuggestionService.generateSuggestions` path.

## Verified Outcomes

1. Spec 147 defaults Off for Project A and Project B.
2. Project A can explicitly enable Spec 147.
3. Project B remains Off.
4. Idle Project A invokes the existing Spec 143 suggestion generation service once.
5. Exactly one suggestion is generated when `maxSuggestionsPerEvaluation` is 1.
6. Generated suggestion belongs to Project A.
7. Generated suggestion remains `proposed` suggestion data and no backlog task is created by Spec 147.
8. Project B receives no automatic suggestion.
9. Immediate repeated evaluation is blocked by cooldown/idempotency.
10. Existing pending suggestion can block another automatic generation.
11. Active execution blocks generation when configured.
12. Pending Ready work blocks generation when configured.
13. Reload preserves policy and cooldown/evaluation metadata.
14. Manual Spec 143 generation remains functional when Spec 147 is disabled.
15. Spec 147 does not directly invoke Spec 145.
16. Spec 147 does not directly invoke Spec 146.
17. Spec 147 does not directly invoke Spec 144.
18. Spec 147 does not invoke Spec 142.
19. Spec 147 does not launch ADOS.
20. Spec 147 does not mutate Git or GitHub.

## Commands Run

```powershell
npx vitest run src/features/city-view/scene/office/project-backlog/ProjectAutonomousSuggestionPolicyService.test.ts src/features/city-view/scene/office/browser-session/BrowserOfficeSessionService.test.ts src/features/city-view/scene/PortfolioOperationsService.test.ts src/features/city-view/scene/office/OfficeProjectPortalController.project-backlog-suggestions.test.ts
```

Result: 4 files passed, 43 tests passed.
