import type { ProjectRegistryRepositoryIdentity } from "../project-registry/ProjectRegistryTypes";
import type { IssueSyncProvider } from "./IssueSyncProvider";
import {
  createFailedIssueSnapshotCollection,
  createUnavailableIssueSnapshotCollection,
  type IssueAuthor,
  type IssueSnapshot,
  type IssueSnapshotCollection,
  type IssueState,
} from "./IssueSyncTypes";

const GITHUB_API_BASE_URL = "https://api.github.com";
const ISSUE_PAGE_SIZE = 50;
const ISSUE_FETCH_LIMIT = ISSUE_PAGE_SIZE + 1;
const BODY_SUMMARY_MAX_LENGTH = 240;

type FetchLike = typeof fetch;

/**
 * Reads at most one bounded page of a repository's GitHub Issues, read-only.
 * Excludes pull requests (GitHub's issues endpoint returns both, distinguished
 * only by the presence of a `pull_request` field) and never throws -- every
 * anticipated failure collapses to a display-safe IssueSnapshotCollection.
 */
export class GitHubIssueSyncProvider implements IssueSyncProvider {
  readonly providerId = "github";

  constructor(private readonly fetchImpl?: FetchLike) {}

  async readIssueSnapshots(identity: ProjectRegistryRepositoryIdentity): Promise<IssueSnapshotCollection> {
    const owner = identity.owner;
    const name = identity.name;
    if (!owner || !name) {
      return createUnavailableIssueSnapshotCollection(identity, "Repository owner or name is not configured.");
    }

    const fetchFn = this.fetchImpl ?? globalThis.fetch;

    try {
      const response = await fetchFn(buildIssuesUrl(owner, name));

      if (isRateLimitedResponse(response)) {
        return createFailedIssueSnapshotCollection(identity, "GitHub rate limit reached for public reads.");
      }

      if (response.status === 404) {
        return createUnavailableIssueSnapshotCollection(identity, "Repository is not publicly available.");
      }

      if (!response.ok) {
        return createFailedIssueSnapshotCollection(identity, "Unable to load issue data.");
      }

      const data = await parseJsonSafely(response);
      if (!Array.isArray(data)) {
        return createFailedIssueSnapshotCollection(identity, "GitHub returned an unexpected response.");
      }

      // The truncation decision is made on the raw, pre-exclusion page: a 51st raw
      // item means there is a next page, regardless of how many kept items turn
      // out to be pull requests after filtering.
      const isTruncated = data.length > ISSUE_PAGE_SIZE;
      const boundedRawItems = data.slice(0, ISSUE_PAGE_SIZE);
      const issueItems = boundedRawItems.filter((item) => !isPullRequestItem(item));

      const syncedAt = new Date().toISOString();
      const snapshots = issueItems
        .map((item) => mapToIssueSnapshot(item, identity, syncedAt))
        .filter((snapshot): snapshot is IssueSnapshot => snapshot !== undefined)
        .sort(compareIssueSnapshots);

      const openCount = snapshots.filter((issue) => issue.state === "Open").length;
      const closedCount = snapshots.length - openCount;

      return {
        provider: identity.provider,
        owner,
        name,
        syncStatus: "Succeeded",
        issues: snapshots,
        openCount,
        closedCount,
        isTruncated,
      };
    } catch {
      return createFailedIssueSnapshotCollection(identity, "Unable to reach GitHub. The network may be unavailable.");
    }
  }
}

function buildIssuesUrl(owner: string, name: string): string {
  return `${GITHUB_API_BASE_URL}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/issues?state=all&sort=updated&direction=desc&per_page=${ISSUE_FETCH_LIMIT}`;
}

function isRateLimitedResponse(response: Response): boolean {
  if (response.status === 429) return true;
  return response.status === 403 && response.headers.get("x-ratelimit-remaining") === "0";
}

function isPullRequestItem(item: unknown): boolean {
  return isPlainObject(item) && "pull_request" in item;
}

function compareIssueSnapshots(a: IssueSnapshot, b: IssueSnapshot): number {
  const statePriority = (state: IssueState) => (state === "Open" ? 0 : 1);
  const stateDiff = statePriority(a.state) - statePriority(b.state);
  if (stateDiff !== 0) return stateDiff;

  const updatedDiff = new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  if (updatedDiff !== 0) return updatedDiff;

  return a.number - b.number;
}

function mapToIssueSnapshot(
  item: unknown,
  identity: ProjectRegistryRepositoryIdentity,
  syncedAt: string,
): IssueSnapshot | undefined {
  if (!isPlainObject(item)) return undefined;

  const number = readNumberField(item, "number");
  const title = readStringField(item, "title");
  const createdAt = readStringField(item, "created_at");
  const updatedAt = readStringField(item, "updated_at");
  if (number === undefined || !title || !createdAt || !updatedAt) return undefined;

  const state: IssueState = readStringField(item, "state") === "closed" ? "Closed" : "Open";

  return {
    id: `${identity.owner ?? ""}/${identity.name ?? ""}#${number}`,
    number,
    title,
    bodySummary: extractBodySummary(item),
    state,
    author: extractAuthor(item),
    assignees: extractAssignees(item),
    labels: extractLabels(item),
    owner: identity.owner,
    name: identity.name,
    provider: identity.provider,
    url: readStringField(item, "html_url"),
    createdAt,
    updatedAt,
    closedAt: readStringField(item, "closed_at"),
    syncedAt,
  };
}

function extractBodySummary(item: Record<string, unknown>): string | undefined {
  const body = readStringField(item, "body");
  if (!body) return undefined;
  if (body.length <= BODY_SUMMARY_MAX_LENGTH) return body;
  return `${body.slice(0, BODY_SUMMARY_MAX_LENGTH).trimEnd()}...`;
}

function extractAuthor(item: Record<string, unknown>): IssueAuthor | undefined {
  const user = item["user"];
  if (!isPlainObject(user)) return undefined;

  const login = readStringField(user, "login");
  return login ? { login } : undefined;
}

function extractAssignees(item: Record<string, unknown>): string[] {
  const raw = item["assignees"];
  if (!Array.isArray(raw)) return [];

  const assignees: string[] = [];
  for (const entry of raw) {
    if (!isPlainObject(entry)) continue;
    const login = readStringField(entry, "login");
    if (login) assignees.push(login);
  }
  return assignees;
}

function extractLabels(item: Record<string, unknown>): string[] {
  const raw = item["labels"];
  if (!Array.isArray(raw)) return [];

  const labels: string[] = [];
  for (const entry of raw) {
    if (typeof entry === "string" && entry.length > 0) {
      labels.push(entry);
      continue;
    }
    if (isPlainObject(entry)) {
      const name = readStringField(entry, "name");
      if (name) labels.push(name);
    }
  }
  return labels;
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
