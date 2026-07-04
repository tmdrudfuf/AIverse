export type GitHubRepositoryConnectionStatus = "not_connected" | "loading" | "connected" | "error";

export type GitHubRepositoryVisibility = "public" | "private" | "unknown";

export type GitHubExternalSourceStatusState =
  | "fresh"
  | "stale"
  | "unavailable"
  | "unauthenticated"
  | "rate_limited"
  | "offline"
  | "unknown";

export type GitHubExternalSourceStatus = {
  state: GitHubExternalSourceStatusState;
  label: string;
  reason?: string;
  lastSuccessfulFetchAt?: string;
  nextRefreshAllowedAt?: string;
};

export type GitHubRepositoryReference = {
  owner: string;
  name: string;
  url?: string;
  visibility: GitHubRepositoryVisibility;
  defaultBranchHint?: string;
};

export type AIverseProjectRepositoryMapping = {
  projectId: string;
  sourceId: string;
  repository: GitHubRepositoryReference;
  enabled: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type GitHubRepositoryMappingValidation = {
  isValid: boolean;
  status: GitHubExternalSourceStatus;
};

export type GitHubLatestCommit = {
  sha: string;
  message: string;
  authorName: string;
  committedAt: string;
};

export type GitHubCheckStatusState = "passing" | "failing" | "pending" | "unavailable" | "unknown";

export type GitHubIssueSummary = {
  openCount: number;
  staleCount?: number;
  labels?: string[];
  latestIssueUpdatedAt?: string;
};

export type GitHubPullRequestSummary = {
  openCount: number;
  draftCount?: number;
  reviewRequestedCount?: number;
  latestPullRequestUpdatedAt?: string;
};

export type GitHubCommitSummary = GitHubLatestCommit & {
  branchName: string;
};

export type GitHubCheckStatusSummary = {
  state: GitHubCheckStatusState;
  label: string;
  checkedAt?: string;
  source?: string;
};

export type GitHubRepositorySnapshot = {
  repositoryId: string;
  owner: string;
  name: string;
  url?: string;
  defaultBranch: string;
  issueSummary: GitHubIssueSummary;
  pullRequestSummary: GitHubPullRequestSummary;
  recentCommitSummary?: GitHubCommitSummary;
  checkStatusSummary: GitHubCheckStatusSummary;
  latestActivityAt?: string;
  fetchedAt?: string;
  sourceStatus: GitHubExternalSourceStatus;
};

export type GitHubRepositorySummary = {
  owner: string;
  name: string;
  defaultBranch: string;
  latestCommit?: GitHubLatestCommit;
  openIssueCount: number;
  openPullRequestCount: number;
  checkStatus?: GitHubCheckStatusSummary;
  sourceStatus?: GitHubExternalSourceStatus;
  lastUpdatedAt?: string;
  connectionStatus: GitHubRepositoryConnectionStatus;
  errorMessage?: string;
};

const SOURCE_STATUS_LABELS: Record<GitHubExternalSourceStatusState, string> = {
  fresh: "Fresh",
  stale: "Stale",
  unavailable: "Unavailable",
  unauthenticated: "Unauthenticated",
  rate_limited: "Rate limited",
  offline: "Offline",
  unknown: "Unknown",
};

export function createGitHubExternalSourceStatus(
  state: GitHubExternalSourceStatusState,
  options: Omit<GitHubExternalSourceStatus, "state" | "label"> & { label?: string } = {},
): GitHubExternalSourceStatus {
  return {
    state,
    label: options.label ?? SOURCE_STATUS_LABELS[state],
    reason: options.reason,
    lastSuccessfulFetchAt: options.lastSuccessfulFetchAt,
    nextRefreshAllowedAt: options.nextRefreshAllowedAt,
  };
}

export function validateAIverseProjectRepositoryMapping(
  mapping: AIverseProjectRepositoryMapping | undefined,
): GitHubRepositoryMappingValidation {
  if (!mapping) {
    return {
      isValid: false,
      status: createGitHubExternalSourceStatus("unavailable", {
        reason: "No GitHub repository mapping is configured for this project.",
      }),
    };
  }

  if (!mapping.enabled) {
    return {
      isValid: false,
      status: createGitHubExternalSourceStatus("unavailable", {
        reason: "GitHub repository mapping is disabled for this project.",
      }),
    };
  }

  if (!isDisplaySafeRepositoryPart(mapping.repository.owner) || !isDisplaySafeRepositoryPart(mapping.repository.name)) {
    return {
      isValid: false,
      status: createGitHubExternalSourceStatus("unavailable", {
        reason: "GitHub repository owner or name is invalid.",
      }),
    };
  }

  if (mapping.repository.visibility === "private") {
    return {
      isValid: false,
      status: createGitHubExternalSourceStatus("unauthenticated", {
        reason: "Private repositories are deferred until credential handling is approved.",
      }),
    };
  }

  return {
    isValid: true,
    status: createGitHubExternalSourceStatus("unknown", {
      reason: "GitHub repository source has not been refreshed yet.",
    }),
  };
}

export function createGitHubRepositorySnapshot(
  mapping: AIverseProjectRepositoryMapping,
  summary: GitHubRepositorySummary,
): GitHubRepositorySnapshot {
  const sourceStatus = createGitHubExternalSourceStatusFromSummary(summary);

  return {
    repositoryId: mapping.sourceId,
    owner: summary.owner || mapping.repository.owner,
    name: summary.name || mapping.repository.name,
    url: mapping.repository.url,
    defaultBranch: summary.defaultBranch || mapping.repository.defaultBranchHint || "unknown",
    issueSummary: {
      openCount: summary.openIssueCount,
    },
    pullRequestSummary: {
      openCount: summary.openPullRequestCount,
    },
    recentCommitSummary: summary.latestCommit
      ? {
          ...summary.latestCommit,
          branchName: summary.defaultBranch || mapping.repository.defaultBranchHint || "unknown",
        }
      : undefined,
    checkStatusSummary: summary.checkStatus ?? {
      state: "unavailable",
      label: "Checks unavailable",
    },
    latestActivityAt: summary.lastUpdatedAt ?? summary.latestCommit?.committedAt,
    fetchedAt: summary.lastUpdatedAt,
    sourceStatus,
  };
}

export function createGitHubExternalSourceStatusFromSummary(
  summary: GitHubRepositorySummary | undefined,
): GitHubExternalSourceStatus {
  if (!summary) {
    return createGitHubExternalSourceStatus("unavailable", {
      reason: "GitHub repository summary has not been loaded.",
    });
  }

  if (summary.sourceStatus) return { ...summary.sourceStatus };

  if (summary.connectionStatus === "connected") {
    return createGitHubExternalSourceStatus("fresh", {
      lastSuccessfulFetchAt: summary.lastUpdatedAt,
    });
  }

  if (summary.connectionStatus === "loading") {
    return createGitHubExternalSourceStatus("unknown", {
      reason: "GitHub repository summary is loading.",
    });
  }

  if (summary.connectionStatus === "not_connected") {
    return createGitHubExternalSourceStatus("unavailable", {
      reason: summary.errorMessage ?? "GitHub repository data is not configured.",
    });
  }

  return createGitHubExternalSourceStatus("unavailable", {
    reason: summary.errorMessage ?? "Unable to load GitHub repository summary.",
  });
}

function isDisplaySafeRepositoryPart(value: string) {
  return /^[A-Za-z0-9_.-]+$/.test(value.trim());
}
