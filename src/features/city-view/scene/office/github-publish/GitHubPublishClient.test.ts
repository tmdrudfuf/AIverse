import { describe, expect, it, vi } from "vitest";
import { GitHubPublishClient } from "./GitHubPublishClient";

function fakeFetchReturning(bodyJson: unknown, ok = true) {
  return vi.fn(async () => ({ ok, json: async () => bodyJson })) as unknown as typeof fetch;
}

describe("GitHubPublishClient", () => {
  it("POSTs the working directory and returns the parsed result", async () => {
    const fetchImpl = fakeFetchReturning({
      attemptId: "a1",
      status: "published",
      refusalReason: null,
      branchName: "aiverse/publish-1",
      commitMessage: "AIverse maintenance update: 1 file changed",
      pullRequestUrl: "https://github.com/example/repo/pull/1",
      evidence: { stdoutSummary: "", stderrSummary: "", failureStep: null },
    });
    const client = new GitHubPublishClient(fetchImpl);

    const result = await client.publish("C:/scratch/project-a");

    expect(fetchImpl).toHaveBeenCalledWith(
      "/api/github-publish/publish",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ workingDirectory: "C:/scratch/project-a" }) }),
    );
    expect(result.status).toBe("published");
    expect(result.pullRequestUrl).toBe("https://github.com/example/repo/pull/1");
  });

  it("reports a failed, honest result without throwing when the bridge cannot be reached", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error("network error");
    }) as unknown as typeof fetch;
    const client = new GitHubPublishClient(fetchImpl);

    const result = await client.publish("C:/scratch/project-a");

    expect(result.status).toBe("failed");
    expect(result.evidence.stderrSummary).toMatch(/could not be reached/i);
  });

  it("reports a failed result on a non-ok HTTP status", async () => {
    const fetchImpl = fakeFetchReturning({}, false);
    const client = new GitHubPublishClient(fetchImpl);

    const result = await client.publish("C:/scratch/project-a");

    expect(result.status).toBe("failed");
  });
});
