# Quickstart: GitHub Public Read Provider

This feature adds `GitHubPublicRepositoryProvider`, a real, unauthenticated, read-only implementation of `GitHubRepositoryProvider`. It is not wired into the running application; it exists as a tested, standalone class.

## Manual verification (optional, requires real network access)

```ts
import { GitHubPublicRepositoryProvider } from "./GitHubPublicRepositoryProvider";

const provider = new GitHubPublicRepositoryProvider(() => ({ owner: "octocat", name: "Hello-World" }));
const summary = await provider.getRepositorySummary("any-project-id");
console.log(summary);
```

This performs real, unauthenticated `GET` requests to `api.github.com`. No token, `.env` value, or credential is required or read. Running this against a rate-limited or offline network will surface the corresponding `rate_limited`/`offline` display-safe state instead of throwing.

## Automated tests

```powershell
npx vitest run src/features/city-view/scene/office/github/GitHubPublicRepositoryProvider.test.ts
```
