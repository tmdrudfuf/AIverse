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

export type GitHubPublishPreview = {
  changedFiles: string[];
  plannedCommitMessage: string;
  hasAnythingToPublish: boolean;
};

const PUBLISH_ENDPOINT = "/api/github-publish/publish";
const STATUS_ENDPOINT = "/api/github-publish/status";
const PREVIEW_ENDPOINT = "/api/github-publish/preview";

const UNKNOWN_PREVIEW: GitHubPublishPreview = { changedFiles: [], plannedCommitMessage: "", hasAnythingToPublish: false };

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

  /** Whether `gh auth status` reports write access, checked server-side. Returns `false` -- never throws -- when the bridge cannot be reached. */
  async getStatus(): Promise<boolean> {
    try {
      const response = await this.fetchImpl(STATUS_ENDPOINT);
      if (!response.ok) return false;
      const body = await response.json();
      return body?.authorized === true;
    } catch {
      return false;
    }
  }

  /** Read-only preview of what a `publish()` call would do right now (User Story 2). Never throws. */
  async getPreview(workingDirectory: string): Promise<GitHubPublishPreview> {
    try {
      const response = await this.fetchImpl(`${PREVIEW_ENDPOINT}?workingDirectory=${encodeURIComponent(workingDirectory)}`);
      if (!response.ok) return UNKNOWN_PREVIEW;
      const body = await response.json();
      if (!Array.isArray(body?.changedFiles)) return UNKNOWN_PREVIEW;
      return body as GitHubPublishPreview;
    } catch {
      return UNKNOWN_PREVIEW;
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
