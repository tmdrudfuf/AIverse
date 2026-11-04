export type GitHubPublishStatus = "running" | "published" | "refused" | "failed";

export type GitHubPublishRefusalReason = "nothing_to_publish" | "no_remote" | "not_authorized" | "already_running";

export type GitHubPublishFailureStep = "branch" | "commit" | "push" | "pull_request";

export type GitHubPublishEvidence = {
  stdoutSummary: string;
  stderrSummary: string;
  failureStep: GitHubPublishFailureStep | null;
};

export type PublishAttempt = {
  attemptId: string;
  workingDirectory: string;
  status: GitHubPublishStatus;
  refusalReason: GitHubPublishRefusalReason | null;
  branchName: string | null;
  commitMessage: string | null;
  pullRequestUrl: string | null;
  startedAt: string;
  completedAt: string | null;
  evidence: GitHubPublishEvidence;
};

export type PublishAuditRecord = Omit<PublishAttempt, "status"> & {
  status: Exclude<GitHubPublishStatus, "running">;
};

export type PublishPreview = {
  changedFiles: string[];
  plannedCommitMessage: string;
  hasAnythingToPublish: boolean;
};

export type GitHubWriteAuthorization = {
  authorized: boolean;
};

export type PublishRequest = {
  workingDirectory: string;
};

export type PublishResponse = {
  attemptId: string;
  status: Exclude<GitHubPublishStatus, "running">;
  refusalReason: GitHubPublishRefusalReason | null;
  branchName: string | null;
  commitMessage: string | null;
  pullRequestUrl: string | null;
  evidence: GitHubPublishEvidence;
};
