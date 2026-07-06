import { describe, expect, it, vi } from "vitest";

import { GITHUB_PUBLIC_READ_SUMMARY_FIELDS } from "./GitHubRepositoryTypes";
import { GitHubPublicRepositoryProvider } from "./GitHubPublicRepositoryProvider";

describe("GitHubPublicRepositoryProvider", () => {
  it("maps a successful public read into a display-safe summary within the approved field boundary", async () => {
    const fetchStub = createFetchStub({
      repo: jsonResponse(200, {
        owner: { login: "ai-verse" },
        name: "daily-proof",
        default_branch: "main",
        open_issues_count: 6,
        pushed_at: "2026-07-01T00:00:00.000Z",
      }),
      commits: jsonResponse(200, [
        {
          sha: "abc1234",
          commit: {
            message: "Stabilize public read provider",
            author: { name: "Ada Lovelace", date: "2026-07-01T00:00:00.000Z" },
          },
        },
      ]),
      pulls: jsonResponse(200, [{ id: 1 }, { id: 2 }]),
    });
    const provider = new GitHubPublicRepositoryProvider(() => ({ owner: "ai-verse", name: "daily-proof" }), fetchStub);

    const summary = await provider.getRepositorySummary("daily-proof");

    expect(summary).toMatchObject({
      owner: "ai-verse",
      name: "daily-proof",
      defaultBranch: "main",
      openIssueCount: 4,
      openPullRequestCount: 2,
      connectionStatus: "connected",
      latestCommit: {
        sha: "abc1234",
        message: "Stabilize public read provider",
        authorName: "Ada Lovelace",
        committedAt: "2026-07-01T00:00:00.000Z",
      },
      sourceStatus: {
        state: "fresh",
      },
    });
    expect(
      Object.keys(summary).every((key) =>
        GITHUB_PUBLIC_READ_SUMMARY_FIELDS.includes(key as (typeof GITHUB_PUBLIC_READ_SUMMARY_FIELDS)[number]),
      ),
    ).toBe(true);
  });

  it("maps a rate-limited response into a display-safe rate_limited state without leaking request details", async () => {
    const fetchStub = createFetchStub({
      repo: emptyResponse(403, { "x-ratelimit-remaining": "0" }),
    });
    const provider = new GitHubPublicRepositoryProvider(() => ({ owner: "ai-verse", name: "daily-proof" }), fetchStub);

    const summary = await provider.getRepositorySummary("daily-proof");

    expect(summary.sourceStatus?.state).toBe("rate_limited");
    expect(summary.connectionStatus).toBe("error");
    expect(summary.errorMessage).not.toContain("api.github.com");
    expect(summary.errorMessage).not.toContain("403");
  });

  it("maps a network/offline failure into a display-safe offline state", async () => {
    const fetchStub = vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    });
    const provider = new GitHubPublicRepositoryProvider(() => ({ owner: "ai-verse", name: "daily-proof" }), fetchStub);

    const summary = await provider.getRepositorySummary("daily-proof");

    expect(summary.sourceStatus?.state).toBe("offline");
    expect(summary.connectionStatus).toBe("error");
    expect(summary.errorMessage).not.toContain("Failed to fetch");
  });

  it("maps a malformed response body into a display-safe unavailable state without throwing", async () => {
    const fetchStub = createFetchStub({
      repo: {
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => {
          throw new SyntaxError("Unexpected token in JSON");
        },
      } as unknown as Response,
    });
    const provider = new GitHubPublicRepositoryProvider(() => ({ owner: "ai-verse", name: "daily-proof" }), fetchStub);

    await expect(provider.getRepositorySummary("daily-proof")).resolves.toMatchObject({
      connectionStatus: "error",
      sourceStatus: { state: "unavailable" },
    });
  });

  it("maps a 404 to unavailable rather than unauthenticated, since visibility is already resolved upstream", async () => {
    const fetchStub = createFetchStub({
      repo: emptyResponse(404),
    });
    const provider = new GitHubPublicRepositoryProvider(() => ({ owner: "ai-verse", name: "missing-repo" }), fetchStub);

    const summary = await provider.getRepositorySummary("missing-repo");

    expect(summary.sourceStatus?.state).toBe("unavailable");
  });

  it("returns the existing unconfigured shape when no repository reference can be resolved", async () => {
    const fetchStub = vi.fn();
    const provider = new GitHubPublicRepositoryProvider(() => undefined, fetchStub);

    const summary = await provider.getRepositorySummary("unmapped-project");

    expect(summary).toEqual({
      owner: "",
      name: "",
      defaultBranch: "",
      openIssueCount: 0,
      openPullRequestCount: 0,
      connectionStatus: "not_connected",
      errorMessage: "Repository data is not configured for this project.",
    });
    expect(fetchStub).not.toHaveBeenCalled();
  });

  it("never sends credentials, tokens, or auth headers, and only issues GET requests", async () => {
    const fetchStub = createFetchStub({
      repo: jsonResponse(200, { default_branch: "main", open_issues_count: 0 }),
      commits: jsonResponse(200, []),
      pulls: jsonResponse(200, []),
    });
    const provider = new GitHubPublicRepositoryProvider(() => ({ owner: "ai-verse", name: "daily-proof" }), fetchStub);

    await provider.getRepositorySummary("daily-proof");

    expect(fetchStub).toHaveBeenCalled();
    fetchStub.mock.calls.forEach((call) => {
      expect(call).toHaveLength(1);
      const [url] = call;
      expect(String(url)).not.toMatch(/token|access_token|client_secret/i);
    });
  });

  it("does not mutate the resolved repository reference while reading a summary", async () => {
    const reference = { owner: "ai-verse", name: "daily-proof" };
    const beforeReference = structuredClone(reference);
    const fetchStub = createFetchStub({
      repo: jsonResponse(200, { default_branch: "main", open_issues_count: 1 }),
      commits: jsonResponse(200, []),
      pulls: jsonResponse(200, []),
    });
    const provider = new GitHubPublicRepositoryProvider(() => reference, fetchStub);

    await provider.getRepositorySummary("daily-proof");

    expect(reference).toEqual(beforeReference);
  });
});

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(),
    json: async () => body,
  } as unknown as Response;
}

function emptyResponse(status: number, headers: Record<string, string> = {}): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(headers),
    json: async () => ({}),
  } as unknown as Response;
}

function createFetchStub(routes: { repo?: Response; commits?: Response; pulls?: Response }) {
  return vi.fn(async (input: string | URL | Request) => {
    const url = String(input);
    if (url.includes("/pulls")) return routes.pulls ?? jsonResponse(200, []);
    if (url.includes("/commits")) return routes.commits ?? jsonResponse(200, []);
    return routes.repo ?? jsonResponse(200, {});
  });
}
