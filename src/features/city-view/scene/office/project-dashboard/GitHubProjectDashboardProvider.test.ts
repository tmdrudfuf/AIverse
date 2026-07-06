import { describe, expect, it } from "vitest";

import type { AIverseProjectRepositoryMapping, GitHubRepositorySummary } from "../github/GitHubRepositoryTypes";
import type { ProjectPortalProject } from "../OfficeProjectPortalTypes";
import { GitHubProjectDashboardProvider } from "./GitHubProjectDashboardProvider";

describe("GitHubProjectDashboardProvider", () => {
  it("maps a public GitHub repository summary into provider-neutral dashboard source metadata", () => {
    const provider = new GitHubProjectDashboardProvider();

    const snapshot = provider.getProjectSnapshot({
      generatedAt: "2026-01-02T10:00:00.000Z",
      projects: [createProject()],
      repositoryMappings: [createMapping()],
      repositorySummaries: {
        "daily-proof": createSummary(),
      },
    }, "daily-proof");

    expect(snapshot.providerId).toBe("github");
    expect(snapshot.project).toMatchObject({
      projectId: "daily-proof",
      name: "Daily Proof",
      isAvailable: true,
    });
    expect(snapshot.source).toMatchObject({
      sourceType: "github",
      sourceId: "github:ai-verse/daily-proof",
      displayName: "ai-verse/daily-proof",
      externalUrl: "https://github.com/ai-verse/daily-proof",
      mappingConfidence: "mapped",
      statusLabel: "Fresh",
      refreshedAt: "2026-06-26T18:30:00.000Z",
    });
    expect(snapshot.source.signals?.map((signal) => [signal.label, signal.value])).toEqual([
      ["Repository", "ai-verse/daily-proof"],
      ["Default Branch", "main"],
      ["Open Issues", "4"],
      ["Open Pull Requests", "2"],
      ["Recent Commit", "dp7f3a2 Stabilize office dashboard repository fixture flow"],
      ["Checks", "CI passing"],
      ["Latest Activity", "2026-06-26T18:30:00.000Z"],
    ]);
    expect(snapshot.activity[0]).toMatchObject({
      id: "github-commit-dp7f3a2",
      label: "Latest GitHub commit: Stabilize office dashboard repository fixture flow",
    });
  });

  it("returns explicit unavailable source status without fabricating GitHub data", () => {
    const provider = new GitHubProjectDashboardProvider();

    const snapshot = provider.getProjectSnapshot({
      projects: [createProject()],
      repositoryMappings: [createMapping()],
    }, "daily-proof");

    expect(snapshot.source).toMatchObject({
      sourceType: "github",
      sourceId: "github:ai-verse/daily-proof",
      statusLabel: "Unavailable",
    });
    expect(snapshot.source.signals).toEqual([]);
    expect(snapshot.activity).toEqual([]);
    expect(snapshot.activeWork).toEqual([]);
    expect(snapshot.employees).toEqual([]);
  });

  it("keeps invalid and private repository mappings unavailable before credential handling exists", () => {
    const provider = new GitHubProjectDashboardProvider();

    const invalid = provider.getProjectSnapshot({
      repositoryMappings: [createMapping({
        repository: {
          owner: "bad owner",
          name: "daily-proof",
          visibility: "public",
        },
      })],
    }, "daily-proof");
    const privateRepository = provider.getProjectSnapshot({
      repositoryMappings: [createMapping({
        repository: {
          owner: "ai-verse",
          name: "private-proof",
          visibility: "private",
        },
      })],
    }, "daily-proof");

    expect(invalid.source.statusLabel).toBe("Unavailable");
    expect(privateRepository.source.statusLabel).toBe("Unauthenticated");
    expect(privateRepository.source.statusReason).not.toContain("token");
  });

  it.each([
    ["stale", "Stale"],
    ["unavailable", "Unavailable"],
    ["unauthenticated", "Unauthenticated"],
    ["rate_limited", "Rate limited"],
    ["offline", "Offline"],
  ] as const)("surfaces %s source status without hiding internal project identity", (state, label) => {
    const provider = new GitHubProjectDashboardProvider();

    const snapshot = provider.getProjectSnapshot({
      projects: [createProject()],
      repositoryMappings: [createMapping()],
      repositorySummaries: {
        "daily-proof": createSummary({
          sourceStatus: {
            state,
            label,
            reason: `${label} source state.`,
          },
        }),
      },
    }, "daily-proof");

    expect(snapshot.project).toMatchObject({
      projectId: "daily-proof",
      name: "Daily Proof",
      isAvailable: true,
    });
    expect(snapshot.source).toMatchObject({
      sourceType: "github",
      statusLabel: label,
      statusReason: `${label} source state.`,
    });
  });

  it("surfaces stale fixture-style source status with recent activity intact", () => {
    const provider = new GitHubProjectDashboardProvider();

    const snapshot = provider.getProjectSnapshot({
      projects: [createProject()],
      repositoryMappings: [createMapping()],
      repositorySummaries: {
        "daily-proof": createSummary({
          name: "daily-proof-stale",
          openIssueCount: 7,
          openPullRequestCount: 1,
          checkStatus: {
            state: "pending",
            label: "Checks pending",
            checkedAt: "2026-06-20T09:20:00.000Z",
          },
          sourceStatus: {
            state: "stale",
            label: "Stale",
            reason: "Local fixture repository data is older than the expected freshness window.",
            lastSuccessfulFetchAt: "2026-06-20T09:30:00.000Z",
          },
          lastUpdatedAt: "2026-06-20T09:30:00.000Z",
        }),
      },
    }, "daily-proof");

    expect(snapshot.source).toMatchObject({
      displayName: "ai-verse/daily-proof-stale",
      statusLabel: "Stale",
      statusReason: "Local fixture repository data is older than the expected freshness window.",
      refreshedAt: "2026-06-20T09:30:00.000Z",
    });
    expect(snapshot.source.signals?.map((signal) => [signal.label, signal.value])).toContainEqual(["Open Issues", "7"]);
    expect(snapshot.source.signals?.map((signal) => [signal.label, signal.value])).toContainEqual(["Open Pull Requests", "1"]);
    expect(snapshot.health.label).toBe("Checks pending");
    expect(snapshot.activity[0]?.label).toContain("Latest GitHub commit:");
  });

  it("surfaces failing fixture checks as read-only project health risk", () => {
    const provider = new GitHubProjectDashboardProvider();

    const snapshot = provider.getProjectSnapshot({
      projects: [createProject()],
      repositoryMappings: [createMapping()],
      repositorySummaries: {
        "daily-proof": createSummary({
          name: "daily-proof-failing",
          defaultBranch: "release/checks",
          openIssueCount: 3,
          openPullRequestCount: 3,
          checkStatus: {
            state: "failing",
            label: "2 checks failing",
            checkedAt: "2026-06-25T15:00:00.000Z",
          },
          sourceStatus: {
            state: "fresh",
            label: "Fresh",
            reason: "Local fixture repository data is current, but checks are failing.",
            lastSuccessfulFetchAt: "2026-06-25T15:05:00.000Z",
          },
          lastUpdatedAt: "2026-06-25T15:05:00.000Z",
        }),
      },
    }, "daily-proof");

    expect(snapshot.health).toMatchObject({
      status: "risk",
      label: "GitHub checks failing",
      reason: "2 checks failing",
      signals: ["2 checks failing"],
    });
    expect(snapshot.source.signals?.map((signal) => [signal.label, signal.value])).toContainEqual(["Default Branch", "release/checks"]);
    expect(snapshot.source.signals?.map((signal) => [signal.label, signal.value])).toContainEqual(["Checks", "2 checks failing"]);
    expect(snapshot.activeWork).toEqual([]);
    expect(snapshot.employees).toEqual([]);
  });

  it("does not expose repository mutation methods or mutate source inputs", () => {
    const provider = new GitHubProjectDashboardProvider();
    const mappings = [createMapping()];
    const summaries = { "daily-proof": createSummary() };
    const beforeMappings = structuredClone(mappings);
    const beforeSummaries = structuredClone(summaries);

    provider.getProjectSnapshot({
      repositoryMappings: mappings,
      repositorySummaries: summaries,
    }, "daily-proof");

    expect(Object.keys(provider)).toEqual(["id", "label"]);
    expect(mappings).toEqual(beforeMappings);
    expect(summaries).toEqual(beforeSummaries);
  });

  it("keeps local advisory empty instead of generating it from repository fixture signals", () => {
    const provider = new GitHubProjectDashboardProvider();

    const snapshot = provider.getProjectSnapshot({
      projects: [createProject()],
      repositoryMappings: [createMapping()],
      repositorySummaries: {
        "daily-proof": createSummary({
          openIssueCount: 9,
          openPullRequestCount: 4,
          checkStatus: {
            state: "failing",
            label: "Fixture checks failing",
          },
        }),
      },
    }, "daily-proof");

    expect(snapshot.advisory).toEqual({
      status: "empty",
      healthSummary: "Local advisory unavailable",
      topRiskLabel: "No local project-manager risk signal is available.",
      nextAttentionLabel: "Review internal simulation context for advisory guidance.",
    });
  });
});

function createProject(): ProjectPortalProject {
  return {
    id: "daily-proof",
    name: "Daily Proof",
    status: "Active",
    type: "Company",
    enabled: true,
    description: "Daily Proof validates AIverse office workflows.",
    linkedServices: [],
    nextAction: {
      label: "Review project workspace",
      enabled: true,
      placeholder: true,
    },
  };
}

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
    sourceStatus: overrides.sourceStatus,
    lastUpdatedAt: overrides.lastUpdatedAt ?? "2026-06-26T18:30:00.000Z",
    connectionStatus: overrides.connectionStatus ?? "connected",
    errorMessage: overrides.errorMessage,
  };
}
