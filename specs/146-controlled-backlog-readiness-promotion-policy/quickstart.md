# Quickstart: Controlled Backlog Readiness Promotion Policy

## Targeted Validation

1. Run the Spec 146 service tests:

   ```powershell
   npx vitest run src/features/city-view/scene/office/project-backlog/ProjectBacklogReadinessPromotionPolicyService.test.ts
   ```

2. Run affected persistence, office, and portfolio tests:

   ```powershell
   npx vitest run src/features/city-view/scene/office/OfficeProjectPortalController.project-backlog.test.ts src/features/city-view/scene/office/OfficeProjectPortalController.browser-session.test.ts src/features/city-view/scene/PortfolioOperationsService.test.ts
   ```

3. Manual runtime scenario:

   - Project A Auto Ready On, allowed priority high, max 1.
   - Project A backlog: A1 high, A2 low.
   - Project B Auto Ready Off, backlog B1 urgent.
   - Evaluate Project A.
   - Expected: A1 becomes Ready once, A2 remains backlog, B1 remains backlog, no execution/development state changes.

4. Reload scenario:

   - Reload after enabling Project A policy and evaluating once.
   - Expected: Project A policy and latest result restore; Project B remains disabled; re-evaluation does not promote A1 again.
