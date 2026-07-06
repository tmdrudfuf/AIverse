import { describe, expect, it } from "vitest";

import {
  createGitHubExternalSourceStatus,
  createGitHubExternalSourceStatusFromSummary,
  createGitHubRepositorySnapshot,
  GITHUB_PUBLIC_READ_SUMMARY_FIELDS,
  type AIverseProjectRepositoryMapping,
  type GitHubRepositorySummary,
  validateAIverseProjectRepositoryMapping,
} from "./GitHubRepositoryTypes";

describe("GitHub repository mapping and source status", () => {
  it("creates display-safe source status labels for all supported states", () => {
    expect([
      createGitHubExternalSourceStatus("fresh").label,
      createGitHubExternalSourceStatus("stale").label,
      createGitHubExternalSourceStatus("unavailable").label,
      createGitHubExternalSourceStatus("unauthenticated").label,
      createGitHubExternalSourceStatus("rate_limited").label,
      createGitHubExternalSourceStatus("offline").label,
      createGitHubExternalSourceStatus("unknown").label,
    ]).toEqual([
      "Fresh",
      "Stale",
      "Unavailable",
      "Unauthenticated",
      "Rate limited",
      "Offline",
      "Unknown",
    ]);
  });

  it("validates an enabled public repository mapping without duplicating simulation state", () => {
    const mapping = createMapping();
    const validation = validateAIverseProjectRepositoryMapping(mapping);

    expect(validation).toMatchObject({
      isValid: true,
      status: {
        state: "unknown",
        label: "Unknown",
      },
    });
    expect(Object.keys(mapping).sort()).toEqual([
      "enabled",
      "projectId",
      "repository",
      "sourceId",
    ]);
    expect(Object.keys(mapping.repository).sort()).toEqual([
      "name",
      "owner",
      "url",
      "visibility",
    ]);
  });

  it("returns unavailable status for missing, disabled, or invalid mappings", () => {
    expect(validateAIverseProjectRepositoryMapping(undefined)).toMatchObject({
      isValid: false,
      status: { state: "unavailable" },
    });
    expect(validateAIverseProjectRepositoryMapping(createMapping({ enabled: false }))).toMatchObject({
      isValid: false,
      status: { state: "unavailable" },
    });
    expect(validateAIverseProjectRepositoryMapping(createMapping({
      repository: {
        owner: "not valid",
        name: "daily-proof",
        visibility: "public",
      },
    }))).toMatchObject({
      isValid: false,
      status: { state: "unavailable" },
    });
  });

  it("keeps private repositories behind an unauthenticated status until credential handling is approved", () => {
    const validation = validateAIverseProjectRepositoryMapping(createMapping({
      repository: {
        owner: "ai-verse",
        name: "private-proof",
        visibility: "private",
      },
    }));

    expect(validation).toMatchObject({
      isValid: false,
      status: {
        state: "unauthenticated",
        label: "Unauthenticated",
      },
    });
    expect(validation.status.reason).not.toContain("token");
  });

  it("maps rich repository summaries into deterministic source snapshots", () => {
    const snapshot = createGitHubRepositorySnapshot(createMapping(), createSummary());

    expect(snapshot).toMatchObject({
      repositoryId: "github:ai-verse/daily-proof",
      owner: "ai-verse",
      name: "daily-proof",
      defaultBranch: "main",
      issueSummary: {
        openCount: 4,
      },
      pullRequestSummary: {
        openCount: 2,
      },
      recentCommitSummary: {
        sha: "dp7f3a2",
        message: "Stabilize office dashboard repository fixture flow",
        branchName: "main",
      },
      checkStatusSummary: {
        state: "passing",
        label: "CI passing",
      },
      latestActivityAt: "2026-06-26T18:30:00.000Z",
      fetchedAt: "2026-06-26T18:30:00.000Z",
      sourceStatus: {
        state: "fresh",
        label: "Fresh",
        reason: "Local fixture repository data is current.",
      },
    });
  });

  it("defines the approved public read summary boundary", () => {
    expect(GITHUB_PUBLIC_READ_SUMMARY_FIELDS).toEqual([
      "owner",
      "name",
      "defaultBranch",
      "latestCommit",
      "openIssueCount",
      "openPullRequestCount",
      "checkStatus",
      "sourceStatus",
      "lastUpdatedAt",
      "connectionStatus",
      "errorMessage",
    ]);
    expect(GITHUB_PUBLIC_READ_SUMMARY_FIELDS).not.toEqual(expect.arrayContaining([
      "token",
      "credentials",
      "auth",
      "sync",
      "webhook",
      "mutation",
      "issues",
      "pullRequests",
      "rawResponse",
    ]));
  });

  it.each([
    ["connected", undefined, "fresh", "Fresh"],
    ["loading", undefined, "unknown", "Unknown"],
    ["not_connected", "Repository data is not configured.", "unavailable", "Unavailable"],
    ["error", "Unable to load repository summary.", "unavailable", "Unavailable"],
  ] as const)("maps %s connection summaries into display-safe source status", (connectionStatus, errorMessage, state, label) => {
    const summary = createSummary({
      connectionStatus,
      errorMessage,
    });
    summary.sourceStatus = undefined;
    const status = createGitHubExternalSourceStatusFromSummary(summary);

    expect(status).toMatchObject({ state, label });
    expect(status.reason ?? "").not.toContain("token");
  });

  it.each([
    ["rate_limited", "Rate limited"],
    ["offline", "Offline"],
    ["stale", "Stale"],
    ["unavailable", "Unavailable"],
    ["unknown", "Unknown"],
    ["unauthenticated", "Unauthenticated"],
  ] as const)("preserves explicit %s source status from provider summaries", (state, label) => {
    const status = createGitHubExternalSourceStatusFromSummary(createSummary({
      sourceStatus: createGitHubExternalSourceStatus(state, {
        reason: `${label} public-read preflight state.`,
      }),
    }));

    expect(status).toEqual({
      state,
      label,
      reason: `${label} public-read preflight state.`,
      lastSuccessfulFetchAt: undefined,
      nextRefreshAllowedAt: undefined,
    });
  });
});

function createMapping(overrides: Partial<AIverseProjectRepositoryMapping> = {}): AIverseProjectRepositoryMapping {
  return {
    projectId: overrides.projectId ?? "daily-proof",
    sourceId: overrides.sourceId ?? "github:ai-verse/daily-proof",
    repository: overrides.repository ?? {
      owner: "ai-verse",
      name: "daily-proof",
      url: "https://github.com/ai-verse/daily-proof",
      visibility: "public",
    },
    enabled: overrides.enabled ?? true,
  };
}

function createSummary(overrides: Partial<GitHubRepositorySummary> = {}): GitHubRepositorySummary {
  return {
    owner: overrides.owner ?? "ai-verse",
    name: overrides.name ?? "daily-proof",
    defaultBranch: overrides.defaultBranch ?? "main",
    latestCommit: overrides.latestCommit ?? {
      sha: "dp7f3a2",
      message: "Stabilize office dashboard repository fixture flow",
      authorName: "AIverse Bot",
      committedAt: "2026-06-26T18:00:00.000Z",
    },
    openIssueCount: overrides.openIssueCount ?? 4,
    openPullRequestCount: overrides.openPullRequestCount ?? 2,
    checkStatus: overrides.checkStatus ?? {
      state: "passing",
      label: "CI passing",
      checkedAt: "2026-06-26T18:24:00.000Z",
      source: "local fixture checks",
    },
    sourceStatus: overrides.sourceStatus ?? createGitHubExternalSourceStatus("fresh", {
      reason: "Local fixture repository data is current.",
      lastSuccessfulFetchAt: "2026-06-26T18:30:00.000Z",
    }),
    lastUpdatedAt: overrides.lastUpdatedAt ?? "2026-06-26T18:30:00.000Z",
    connectionStatus: overrides.connectionStatus ?? "connected",
    errorMessage: overrides.errorMessage,
  };
}
