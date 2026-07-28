import { describe, expect, it, vi } from "vitest";

import type { ProjectRegistryRepositoryIdentity } from "../project-registry/ProjectRegistryTypes";
import { GitHubIssueSyncProvider } from "./GitHubIssueSyncProvider";

const IDENTITY: ProjectRegistryRepositoryIdentity = {
  provider: "github",
  owner: "ai-verse",
  name: "daily-proof",
  defaultBranch: "main",
  connectionState: "Configured",
};

function rawIssue(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    number: 1,
    title: "Fix bug",
    body: "Some description",
    state: "open",
    user: { login: "octocat" },
    assignees: [{ login: "hubot" }],
    labels: [{ name: "bug" }],
    html_url: "https://github.com/ai-verse/daily-proof/issues/1",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-02T00:00:00.000Z",
    closed_at: null,
    ...overrides,
  };
}

function rawPullRequest(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    ...rawIssue({ number: 999, title: "A pull request" }),
    pull_request: { url: "https://api.github.com/repos/ai-verse/daily-proof/pulls/999" },
    ...overrides,
  };
}

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(),
    json: async () => body,
  } as unknown as Response;
}

function rateLimitedResponse(): Response {
  return {
    ok: false,
    status: 403,
    headers: new Headers({ "x-ratelimit-remaining": "0" }),
    json: async () => ({}),
  } as unknown as Response;
}

describe("GitHubIssueSyncProvider", () => {
  it("normalizes issues and excludes pull requests from output, counts, and ordering", async () => {
    const fetchStub = vi.fn(async () =>
      jsonResponse(200, [
        rawIssue({ number: 1, state: "open", updated_at: "2026-01-03T00:00:00.000Z" }),
        rawPullRequest({ number: 2 }),
        rawIssue({ number: 3, state: "closed", updated_at: "2026-01-01T00:00:00.000Z" }),
      ]),
    );
    const provider = new GitHubIssueSyncProvider(fetchStub);

    const collection = await provider.readIssueSnapshots(IDENTITY);

    expect(collection.syncStatus).toBe("Succeeded");
    expect(collection.issues).toHaveLength(2);
    expect(collection.issues.map((issue) => issue.number)).toEqual([1, 3]);
    expect(collection.openCount).toBe(1);
    expect(collection.closedCount).toBe(1);
    expect(collection.issues.some((issue) => issue.number === 2)).toBe(false);
  });

  it("normalizes both GitHub label shapes (string and {name}) to plain names", async () => {
    const fetchStub = vi.fn(async () =>
      jsonResponse(200, [rawIssue({ number: 1, labels: [{ name: "bug" }, "priority:high"] })]),
    );
    const provider = new GitHubIssueSyncProvider(fetchStub);

    const collection = await provider.readIssueSnapshots(IDENTITY);

    expect(collection.issues[0]?.labels).toEqual(["bug", "priority:high"]);
  });

  it("handles missing optional body, labels, assignees, and closed_at safely", async () => {
    const fetchStub = vi.fn(async () =>
      jsonResponse(200, [
        rawIssue({ number: 1, body: null, labels: undefined, assignees: undefined, closed_at: null, user: null }),
      ]),
    );
    const provider = new GitHubIssueSyncProvider(fetchStub);

    const collection = await provider.readIssueSnapshots(IDENTITY);
    const issue = collection.issues[0];

    expect(issue?.bodySummary).toBeUndefined();
    expect(issue?.labels).toEqual([]);
    expect(issue?.assignees).toEqual([]);
    expect(issue?.closedAt).toBeUndefined();
    expect(issue?.author).toBeUndefined();
  });

  it("normalizes open and closed state correctly", async () => {
    const fetchStub = vi.fn(async () =>
      jsonResponse(200, [rawIssue({ number: 1, state: "open" }), rawIssue({ number: 2, state: "closed" })]),
    );
    const provider = new GitHubIssueSyncProvider(fetchStub);

    const collection = await provider.readIssueSnapshots(IDENTITY);

    expect(collection.issues.find((issue) => issue.number === 1)?.state).toBe("Open");
    expect(collection.issues.find((issue) => issue.number === 2)?.state).toBe("Closed");
  });

  it("orders issues open-before-closed, most-recently-updated first, number as a tie-break", async () => {
    const fetchStub = vi.fn(async () =>
      jsonResponse(200, [
        rawIssue({ number: 5, state: "closed", updated_at: "2026-01-05T00:00:00.000Z" }),
        rawIssue({ number: 2, state: "open", updated_at: "2026-01-01T00:00:00.000Z" }),
        rawIssue({ number: 1, state: "open", updated_at: "2026-01-04T00:00:00.000Z" }),
        rawIssue({ number: 3, state: "open", updated_at: "2026-01-04T00:00:00.000Z" }),
        rawIssue({ number: 4, state: "closed", updated_at: "2026-01-06T00:00:00.000Z" }),
      ]),
    );
    const provider = new GitHubIssueSyncProvider(fetchStub);

    const collection = await provider.readIssueSnapshots(IDENTITY);

    expect(collection.issues.map((issue) => issue.number)).toEqual([1, 3, 2, 4, 5]);
  });

  it("marks the collection truncated when 51 raw items are returned", async () => {
    const rawItems = Array.from({ length: 51 }, (_, index) => rawIssue({ number: index + 1 }));
    const fetchStub = vi.fn(async () => jsonResponse(200, rawItems));
    const provider = new GitHubIssueSyncProvider(fetchStub);

    const collection = await provider.readIssueSnapshots(IDENTITY);

    expect(collection.isTruncated).toBe(true);
    expect(collection.issues).toHaveLength(50);
  });

  it("does not mark the collection truncated at exactly 50 raw items", async () => {
    const rawItems = Array.from({ length: 50 }, (_, index) => rawIssue({ number: index + 1 }));
    const fetchStub = vi.fn(async () => jsonResponse(200, rawItems));
    const provider = new GitHubIssueSyncProvider(fetchStub);

    const collection = await provider.readIssueSnapshots(IDENTITY);

    expect(collection.isTruncated).toBe(false);
    expect(collection.issues).toHaveLength(50);
  });

  it("judges truncation on the raw page, not the post-exclusion issue count", async () => {
    // 51 raw items, but 40 of them are pull requests -- only 11 real issues remain,
    // yet the raw page still had a 51st item, so truncation must still be reported.
    const rawItems = [
      ...Array.from({ length: 11 }, (_, index) => rawIssue({ number: index + 1 })),
      ...Array.from({ length: 40 }, (_, index) => rawPullRequest({ number: 1000 + index })),
    ];
    const fetchStub = vi.fn(async () => jsonResponse(200, rawItems));
    const provider = new GitHubIssueSyncProvider(fetchStub);

    const collection = await provider.readIssueSnapshots(IDENTITY);

    expect(collection.isTruncated).toBe(true);
    expect(collection.issues).toHaveLength(11);
  });

  it("maps a 404 response to Unavailable", async () => {
    const fetchStub = vi.fn(async () => jsonResponse(404, {}));
    const provider = new GitHubIssueSyncProvider(fetchStub);

    const collection = await provider.readIssueSnapshots(IDENTITY);

    expect(collection.syncStatus).toBe("Unavailable");
    expect(collection.errorSummary).toBeTruthy();
  });

  it("maps a rate-limited response to Failed", async () => {
    const fetchStub = vi.fn(async () => rateLimitedResponse());
    const provider = new GitHubIssueSyncProvider(fetchStub);

    const collection = await provider.readIssueSnapshots(IDENTITY);

    expect(collection.syncStatus).toBe("Failed");
    expect(collection.errorSummary).not.toContain("403");
    expect(collection.errorSummary).not.toContain("api.github.com");
  });

  it("maps a network exception to Failed without leaking the raw error", async () => {
    const fetchStub = vi.fn(async () => {
      throw new Error("token ghp_secret leaked in stack trace");
    });
    const provider = new GitHubIssueSyncProvider(fetchStub);

    const collection = await provider.readIssueSnapshots(IDENTITY);

    expect(collection.syncStatus).toBe("Failed");
    expect(collection.errorSummary).not.toContain("token");
    expect(collection.errorSummary).not.toContain("ghp_secret");
  });

  it("returns Unavailable without fetching when the identity has no owner/name", async () => {
    const fetchStub = vi.fn(async () => jsonResponse(200, []));
    const provider = new GitHubIssueSyncProvider(fetchStub);

    const collection = await provider.readIssueSnapshots({ provider: "github", connectionState: "Unknown" });

    expect(collection.syncStatus).toBe("Unavailable");
    expect(fetchStub).not.toHaveBeenCalled();
  });

  it("never issues a mutating request -- only a GET-shaped fetch to the issues endpoint", async () => {
    const fetchStub = vi.fn(async (_input?: string | URL | Request, _init?: RequestInit) => jsonResponse(200, []));
    const provider = new GitHubIssueSyncProvider(fetchStub);

    await provider.readIssueSnapshots(IDENTITY);

    expect(fetchStub).toHaveBeenCalledTimes(1);
    const [url, init] = fetchStub.mock.calls[0]!;
    expect(String(url)).toContain("/repos/ai-verse/daily-proof/issues");
    expect(init).toBeUndefined();
  });

  it("does not corrupt a produced snapshot when the raw response's nested labels/assignees arrays are mutated afterward", async () => {
    const rawLabels = [{ name: "bug" }];
    const rawAssignees = [{ login: "hubot" }];
    const rawItems = [rawIssue({ number: 1, labels: rawLabels, assignees: rawAssignees })];
    const fetchStub = vi.fn(async () => jsonResponse(200, rawItems));
    const provider = new GitHubIssueSyncProvider(fetchStub);

    const collection = await provider.readIssueSnapshots(IDENTITY);
    const issue = collection.issues[0]!;

    rawLabels.push({ name: "injected-after-the-fact" });
    rawAssignees.push({ login: "injected-after-the-fact" });
    rawItems[0]!["labels"] = [];

    expect(issue.labels).toEqual(["bug"]);
    expect(issue.assignees).toEqual(["hubot"]);
  });

  it("does not let a caller mutating a returned collection's issues/labels/assignees arrays affect a later read", async () => {
    const fetchStub = vi.fn(async () => jsonResponse(200, [rawIssue({ number: 1, labels: [{ name: "bug" }] })]));
    const provider = new GitHubIssueSyncProvider(fetchStub);

    const first = await provider.readIssueSnapshots(IDENTITY);
    first.issues.push({ ...first.issues[0]!, number: 999 });
    first.issues[0]!.labels.push("injected-after-the-fact");
    first.issues[0]!.assignees.push("injected-after-the-fact");

    const second = await provider.readIssueSnapshots(IDENTITY);

    expect(second.issues).toHaveLength(1);
    expect(second.issues[0]!.labels).toEqual(["bug"]);
    expect(second.issues[0]!.assignees).toEqual(["hubot"]);
    expect(second.issues).not.toBe(first.issues);
  });
});
