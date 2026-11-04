export type GitHubPublishStatus = "published" | "refused" | "failed";

export type GitHubPublishEvidence = {
  stdoutSummary: string;
  stderrSummary: string;
  failureStep: string | null;
};

export type GitHubPublishResult = {
  attemptId: string;
  status: GitHubPublishStatus;
  refusalReason: string | null;
  branchName: string | null;
  commitMessage: string | null;
  pullRequestUrl: string | null;
  evidence: GitHubPublishEvidence;
};

const PUBLISH_ENDPOINT = "/api/github-publish/publish";

/**
 * Browser-side client for the GitHub write integration server bridge: a
 * plain `fetch()` wrapper with no `node:child_process` (or any other
 * server-only) import, mirroring
 * `ServerBridgeImplementerRuntimeProvider`/`ServerBridgeReviewerRuntimeProvider`
 * from Spec 149 exactly -- see that file's own comment for why this
 * carries no bundling risk.
 */
export class GitHubPublishClient {
  constructor(private readonly fetchImpl: typeof fetch = fetch) {}

  async publish(workingDirectory: string): Promise<GitHubPublishResult> {
    let response: Response;
    try {
      response = await this.fetchImpl(PUBLISH_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workingDirectory }),
      });
    } catch {
      return createUnreachableResult();
    }

    if (!response.ok) {
      return createUnreachableResult();
    }

    try {
      const body = await response.json();
      if (typeof body?.status !== "string") throw new Error("malformed response");
      return body as GitHubPublishResult;
    } catch {
      return createUnreachableResult();
    }
  }
}

function createUnreachableResult(): GitHubPublishResult {
  return {
    attemptId: "",
    status: "failed",
    refusalReason: null,
    branchName: null,
    commitMessage: null,
    pullRequestUrl: null,
    evidence: { stdoutSummary: "", stderrSummary: "The GitHub publish server bridge could not be reached.", failureStep: null },
  };
}
