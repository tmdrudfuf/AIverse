import type { GitHubRepositoryProvider } from "./GitHubRepositoryProvider";
import type {
  GitHubExternalSourceStatusState,
  GitHubLatestCommit,
  GitHubRepositorySummary,
} from "./GitHubRepositoryTypes";
import { createGitHubExternalSourceStatus } from "./GitHubRepositoryTypes";

const GITHUB_API_BASE_URL = "https://api.github.com";
const OPEN_PULL_REQUEST_PAGE_SIZE = 100;

export type GitHubRepositoryReference = {
  owner: string;
  name: string;
};

export type GitHubRepositoryReferenceResolver = (
  projectId: string,
) => GitHubRepositoryReference | undefined;

type FetchLike = typeof fetch;

/**
 * The first real, unauthenticated, read-only GitHubRepositoryProvider implementation.
 * Only issues GET requests to public api.github.com endpoints and never throws;
 * every anticipated failure collapses to an existing display-safe GitHubRepositorySummary state.
 */
export class GitHubPublicRepositoryProvider implements GitHubRepositoryProvider {
  constructor(
    private readonly resolveRepositoryReference: GitHubRepositoryReferenceResolver,
    private readonly fetchImpl?: FetchLike,
  ) {}

  async getRepositorySummary(projectId: string): Promise<GitHubRepositorySummary> {
    const reference = this.resolveRepositoryReference(projectId);
    if (!reference) return createUnconfiguredSummary();

    const fetchFn = this.fetchImpl ?? globalThis.fetch;

    try {
      const repositoryResponse = await fetchFn(buildRepositoryUrl(reference));

      if (isRateLimitedResponse(repositoryResponse)) {
        return createFailureSummary(reference, "rate_limited", "GitHub rate limit reached for public reads.");
      }

      if (repositoryResponse.status === 404) {
        return createFailureSummary(reference, "unavailable", "Repository is not publicly available.");
      }

      if (!repositoryResponse.ok) {
        return createFailureSummary(reference, "unavailable", "Unable to load repository summary.");
      }

      const repositoryData = await parseJsonSafely(repositoryResponse);
      if (!isPlainObject(repositoryData)) {
        return createFailureSummary(reference, "unavailable", "GitHub returned an unexpected response.");
      }

      const owner = readOwnerLogin(repositoryData) ?? reference.owner;
      const name = readStringField(repositoryData, "name") ?? reference.name;
      const defaultBranch = readStringField(repositoryData, "default_branch") ?? "unknown";
      const openIssuesAndPullRequests = readNumberField(repositoryData, "open_issues_count") ?? 0;
      const lastUpdatedAt =
        readStringField(repositoryData, "pushed_at") ?? readStringField(repositoryData, "updated_at");

      const [latestCommit, openPullRequestCount] = await Promise.all([
        readLatestCommit(fetchFn, reference, defaultBranch),
        readOpenPullRequestCount(fetchFn, reference),
      ]);

      return {
        owner,
        name,
        defaultBranch,
        latestCommit,
        openIssueCount: Math.max(0, openIssuesAndPullRequests - openPullRequestCount),
        openPullRequestCount,
        lastUpdatedAt,
        connectionStatus: "connected",
        sourceStatus: createGitHubExternalSourceStatus("fresh", {
          lastSuccessfulFetchAt: new Date().toISOString(),
        }),
      };
    } catch {
      return createFailureSummary(reference, "offline", "Unable to reach GitHub. The network may be unavailable.");
    }
  }
}

function buildRepositoryUrl(reference: GitHubRepositoryReference): string {
  return `${GITHUB_API_BASE_URL}/repos/${encodeURIComponent(reference.owner)}/${encodeURIComponent(reference.name)}`;
}

function isRateLimitedResponse(response: Response): boolean {
  if (response.status === 429) return true;
  return response.status === 403 && response.headers.get("x-ratelimit-remaining") === "0";
}

async function readLatestCommit(
  fetchFn: FetchLike,
  reference: GitHubRepositoryReference,
  defaultBranch: string,
): Promise<GitHubLatestCommit | undefined> {
  try {
    const response = await fetchFn(
      `${GITHUB_API_BASE_URL}/repos/${encodeURIComponent(reference.owner)}/${encodeURIComponent(reference.name)}/commits?sha=${encodeURIComponent(defaultBranch)}&per_page=1`,
    );
    if (!response.ok) return undefined;

    const data = await parseJsonSafely(response);
    if (!Array.isArray(data) || data.length === 0) return undefined;

    return extractLatestCommit(data[0]);
  } catch {
    return undefined;
  }
}

async function readOpenPullRequestCount(
  fetchFn: FetchLike,
  reference: GitHubRepositoryReference,
): Promise<number> {
  try {
    const response = await fetchFn(
      `${GITHUB_API_BASE_URL}/repos/${encodeURIComponent(reference.owner)}/${encodeURIComponent(reference.name)}/pulls?state=open&per_page=${OPEN_PULL_REQUEST_PAGE_SIZE}`,
    );
    if (!response.ok) return 0;

    const data = await parseJsonSafely(response);
    return Array.isArray(data) ? data.length : 0;
  } catch {
    return 0;
  }
}

function extractLatestCommit(entry: unknown): GitHubLatestCommit | undefined {
  if (!isPlainObject(entry)) return undefined;

  const sha = readStringField(entry, "sha");
  const commit = entry["commit"];
  if (!sha || !isPlainObject(commit)) return undefined;

  const message = readStringField(commit, "message");
  const author = commit["author"];
  if (!message || !isPlainObject(author)) return undefined;

  const authorName = readStringField(author, "name");
  const committedAt = readStringField(author, "date");
  if (!authorName || !committedAt) return undefined;

  return { sha, message, authorName, committedAt };
}

function readOwnerLogin(value: Record<string, unknown>): string | undefined {
  const owner = value["owner"];
  return isPlainObject(owner) ? readStringField(owner, "login") : undefined;
}

function readStringField(value: Record<string, unknown>, key: string): string | undefined {
  const field = value[key];
  return typeof field === "string" && field.length > 0 ? field : undefined;
}

function readNumberField(value: Record<string, unknown>, key: string): number | undefined {
  const field = value[key];
  return typeof field === "number" && Number.isFinite(field) ? field : undefined;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function parseJsonSafely(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

function createUnconfiguredSummary(): GitHubRepositorySummary {
  return {
    owner: "",
    name: "",
    defaultBranch: "",
    openIssueCount: 0,
    openPullRequestCount: 0,
    connectionStatus: "not_connected",
    errorMessage: "Repository data is not configured for this project.",
  };
}

function createFailureSummary(
  reference: GitHubRepositoryReference,
  state: GitHubExternalSourceStatusState,
  reason: string,
): GitHubRepositorySummary {
  return {
    owner: reference.owner,
    name: reference.name,
    defaultBranch: "",
    openIssueCount: 0,
    openPullRequestCount: 0,
    connectionStatus: "error",
    errorMessage: reason,
    sourceStatus: createGitHubExternalSourceStatus(state, { reason }),
  };
}
