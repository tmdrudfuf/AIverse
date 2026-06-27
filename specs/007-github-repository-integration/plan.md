# Implementation Plan: GitHub Repository Integration Foundation

## Technical Approach
Add GitHub repository model/provider/service files under the office portal boundary. Use a mock provider for deterministic Daily Proof data. Extend portal state with repository summaries and add a repository-detail view mode.

## Files
- src/features/city-view/scene/office/github/GitHubRepositoryTypes.ts
- src/features/city-view/scene/office/github/GitHubRepositoryProvider.ts
- src/features/city-view/scene/office/github/MockGitHubRepositoryProvider.ts
- src/features/city-view/scene/office/github/GitHubRepositoryService.ts
- OfficeProjectPortalTypes.ts
- OfficeProjectPortalRegistry.ts
- OfficeProjectPortalController.ts
- OfficeProjectPortalView.ts

## Validation
Run npx tsc --noEmit, npm run build, and git diff --check. Manually verify repository-detail navigation and that no network/API/token code was added.