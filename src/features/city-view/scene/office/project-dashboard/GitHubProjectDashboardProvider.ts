import type {
  AIverseProjectRepositoryMapping,
  GitHubRepositorySummary,
} from "../github/GitHubRepositoryTypes";
import {
  createGitHubExternalSourceStatus,
  createGitHubRepositorySnapshot,
  validateAIverseProjectRepositoryMapping,
} from "../github/GitHubRepositoryTypes";
import type { ProjectPortalProject } from "../OfficeProjectPortalTypes";
import {
  createProjectDashboardSectionAvailability,
  type ProjectDashboardActivityItem,
  type ProjectDashboardExternalSourceSignal,
  type ProjectDashboardHealthSummary,
  type ProjectDashboardListItem,
  type ProjectDashboardProvider,
  type ProjectDashboardProviderContext,
  type ProjectDashboardSnapshot,
} from "./ProjectDashboardTypes";

const GITHUB_PROJECT_DASHBOARD_PROVIDER_ID = "github";
const DEFAULT_GITHUB_PROJECT_DASHBOARD_TIMESTAMP = "2026-01-01T00:00:00.000Z";

export type GitHubProjectDashboardProviderContext = ProjectDashboardProviderContext & {
  projects?: ReadonlyArray<ProjectPortalProject>;
  repositoryMappings?: ReadonlyArray<AIverseProjectRepositoryMapping>;
  repositorySummaries?: Record<string, GitHubRepositorySummary>;
};

export class GitHubProjectDashboardProvider implements ProjectDashboardProvider {
  readonly id = GITHUB_PROJECT_DASHBOARD_PROVIDER_ID;
  readonly label = "GitHub";

  listProjects(context: GitHubProjectDashboardProviderContext = {}): ProjectDashboardListItem[] {
    return (context.repositoryMappings ?? [])
      .filter((mapping) => validateAIverseProjectRepositoryMapping(mapping).isValid)
      .map((mapping) => {
        const project = findProject(context.projects, mapping.projectId);
        return {
          projectId: mapping.projectId,
          name: project?.name ?? `${mapping.repository.owner}/${mapping.repository.name}`,
          status: project?.status ?? "Active",
          healthLabel: "GitHub source mapped",
        };
      });
  }

  getProjectSnapshot(
    context: GitHubProjectDashboardProviderContext = {},
    projectId: string,
  ): ProjectDashboardSnapshot {
    const mapping = (context.repositoryMappings ?? []).find((item) => item.projectId === projectId);
    const project = findProject(context.projects, projectId);
    const generatedAt = context.generatedAt ?? DEFAULT_GITHUB_PROJECT_DASHBOARD_TIMESTAMP;
    const mappingValidation = validateAIverseProjectRepositoryMapping(mapping);

    if (!mapping || !mappingValidation.isValid) {
      const status = mappingValidation.status;
      return createGitHubUnavailableSnapshot(projectId, generatedAt, project, status);
    }

    const summary = context.repositorySummaries?.[projectId];
    if (!summary) {
      return createGitHubUnavailableSnapshot(
        projectId,
        generatedAt,
        project,
        createGitHubExternalSourceStatus("unavailable", {
          reason: "GitHub repository summary has not been loaded.",
        }),
        mapping,
      );
    }

    const snapshot = createGitHubRepositorySnapshot(mapping, summary);
    const repositoryLabel = `${snapshot.owner}/${snapshot.name}`;
    const signals = createSourceSignals(snapshot);
    const activity = createActivity(snapshot);

    return {
      providerId: this.id,
      generatedAt: context.generatedAt ?? snapshot.fetchedAt ?? snapshot.latestActivityAt ?? generatedAt,
      project: {
        projectId,
        name: project?.name ?? repositoryLabel,
        status: project?.status ?? "Active",
        description: project?.description,
        isAvailable: true,
      },
      progress: {
        completedWorkCount: 0,
        totalWorkCount: 0,
        label: "GitHub progress is observational only",
      },
      health: createHealth(summary, snapshot.sourceStatus.label),
      activeWork: [],
      employees: [],
      blockers: [],
      activity,
      relatedFocus: {
        employeeFocusLabels: [],
        summary: "GitHub source data does not assign employee focus.",
      },
      nextSuggestedFocus: undefined,
      advisory: createGitHubAdvisorySignal(),
      source: {
        sourceType: "github",
        sourceId: mapping.sourceId,
        displayName: repositoryLabel,
        externalUrl: mapping.repository.url,
        mappingConfidence: "mapped",
        statusLabel: snapshot.sourceStatus.label,
        statusReason: snapshot.sourceStatus.reason,
        refreshedAt: snapshot.fetchedAt,
        signals,
      },
      sections: [
        createProjectDashboardSectionAvailability("project_summary", "Project Summary", "available"),
        createProjectDashboardSectionAvailability("project_progress", "Project Progress", "empty", "GitHub progress is read-only source context."),
        createProjectDashboardSectionAvailability("active_work", "Active Work", "empty", "GitHub source data does not create AIverse tasks."),
        createProjectDashboardSectionAvailability("related_employees", "Related Employees", "empty", "GitHub source data does not assign employees."),
        createProjectDashboardSectionAvailability("blockers", "Blockers", "empty"),
        createProjectDashboardSectionAvailability("recent_activity", "Recent Activity", activity.length > 0 ? "available" : "empty"),
        createProjectDashboardSectionAvailability("related_focus", "Related Focus", "empty"),
        createProjectDashboardSectionAvailability("project_health", "Project Health", "available"),
        createProjectDashboardSectionAvailability("project_advisory", "Project Advisory", "empty", "GitHub source data does not provide local project-manager advisory signals."),
        createProjectDashboardSectionAvailability("source_metadata", "Source Metadata", "available"),
      ],
    };
  }
}

type GitHubRepositorySnapshot = ReturnType<typeof createGitHubRepositorySnapshot>;

function createGitHubUnavailableSnapshot(
  projectId: string,
  generatedAt: string,
  project: ProjectPortalProject | undefined,
  status: ReturnType<typeof createGitHubExternalSourceStatus>,
  mapping?: AIverseProjectRepositoryMapping,
): ProjectDashboardSnapshot {
  return {
    providerId: GITHUB_PROJECT_DASHBOARD_PROVIDER_ID,
    generatedAt,
    project: {
      projectId,
      name: project?.name ?? "GitHub source unavailable",
      status: project?.status ?? "Unavailable",
      description: project?.description,
      isAvailable: Boolean(project),
    },
    progress: {
      completedWorkCount: 0,
      totalWorkCount: 0,
      label: "GitHub progress unavailable",
    },
    health: {
      status: "unknown",
      label: status.label,
      reason: status.reason ?? "GitHub source status is unavailable.",
      signals: [],
    },
    activeWork: [],
    employees: [],
    blockers: [],
    activity: [],
    relatedFocus: {
      employeeFocusLabels: [],
      summary: "GitHub source data does not assign employee focus.",
    },
    advisory: createGitHubAdvisorySignal(),
    source: {
      sourceType: "github",
      sourceId: mapping?.sourceId ?? projectId,
      displayName: mapping ? `${mapping.repository.owner}/${mapping.repository.name}` : undefined,
      externalUrl: mapping?.repository.url,
      mappingConfidence: mapping ? "mapped" : "unknown",
      statusLabel: status.label,
      statusReason: status.reason,
      refreshedAt: status.lastSuccessfulFetchAt,
      signals: [],
    },
    sections: [
      createProjectDashboardSectionAvailability("project_summary", "Project Summary", project ? "available" : "unavailable"),
      createProjectDashboardSectionAvailability("project_progress", "Project Progress", "empty"),
      createProjectDashboardSectionAvailability("active_work", "Active Work", "empty"),
      createProjectDashboardSectionAvailability("related_employees", "Related Employees", "empty"),
      createProjectDashboardSectionAvailability("blockers", "Blockers", "empty"),
      createProjectDashboardSectionAvailability("recent_activity", "Recent Activity", "empty"),
      createProjectDashboardSectionAvailability("related_focus", "Related Focus", "empty"),
      createProjectDashboardSectionAvailability("project_health", "Project Health", "unavailable", status.reason),
      createProjectDashboardSectionAvailability("project_advisory", "Project Advisory", "empty", "GitHub source data does not provide local project-manager advisory signals."),
      createProjectDashboardSectionAvailability("source_metadata", "Source Metadata", "available"),
    ],
  };
}

function createGitHubAdvisorySignal() {
  return {
    status: "empty" as const,
    healthSummary: "Local advisory unavailable",
    topRiskLabel: "No local project-manager risk signal is available.",
    nextAttentionLabel: "Review internal simulation context for advisory guidance.",
  };
}

function createSourceSignals(snapshot: GitHubRepositorySnapshot): ProjectDashboardExternalSourceSignal[] {
  return [
    {
      id: "repository",
      label: "Repository",
      value: `${snapshot.owner}/${snapshot.name}`,
      status: "available",
    },
    {
      id: "default-branch",
      label: "Default Branch",
      value: snapshot.defaultBranch,
      status: snapshot.defaultBranch === "unknown" ? "unavailable" : "available",
    },
    {
      id: "open-issues",
      label: "Open Issues",
      value: String(snapshot.issueSummary.openCount),
      status: "available",
    },
    {
      id: "open-pull-requests",
      label: "Open Pull Requests",
      value: String(snapshot.pullRequestSummary.openCount),
      status: "available",
    },
    {
      id: "recent-commit",
      label: "Recent Commit",
      value: snapshot.recentCommitSummary
        ? `${snapshot.recentCommitSummary.sha} ${snapshot.recentCommitSummary.message}`
        : "Unavailable",
      status: snapshot.recentCommitSummary ? "available" : "empty",
    },
    {
      id: "checks",
      label: "Checks",
      value: snapshot.checkStatusSummary.label,
      status: snapshot.checkStatusSummary.state === "unavailable" ? "unavailable" : "available",
    },
    {
      id: "latest-activity",
      label: "Latest Activity",
      value: snapshot.latestActivityAt ?? "Unavailable",
      status: snapshot.latestActivityAt ? "available" : "empty",
    },
  ];
}

function createHealth(
  summary: GitHubRepositorySummary,
  statusLabel: string,
): ProjectDashboardHealthSummary {
  if (summary.connectionStatus !== "connected") {
    return {
      status: "unknown",
      label: statusLabel,
      reason: summary.errorMessage ?? "GitHub source data is unavailable.",
      signals: [],
    };
  }

  if (summary.checkStatus?.state === "failing") {
    return {
      status: "risk",
      label: "GitHub checks failing",
      reason: summary.checkStatus.label,
      signals: [summary.checkStatus.label],
    };
  }

  return {
    status: summary.checkStatus?.state === "passing" ? "healthy" : "watch",
    label: summary.checkStatus?.label ?? "GitHub source connected",
    reason: "GitHub repository source is read-only and available.",
    signals: [
      `${summary.openIssueCount} open issue(s)`,
      `${summary.openPullRequestCount} open pull request(s)`,
    ],
  };
}

function createActivity(snapshot: GitHubRepositorySnapshot): ProjectDashboardActivityItem[] {
  if (!snapshot.recentCommitSummary) return [];

  return [{
    id: `github-commit-${snapshot.recentCommitSummary.sha}`,
    timestamp: snapshot.recentCommitSummary.committedAt,
    type: "progression",
    label: `Latest GitHub commit: ${snapshot.recentCommitSummary.message}`,
    description: `${snapshot.recentCommitSummary.authorName} on ${snapshot.recentCommitSummary.branchName}.`,
  }];
}

function findProject(
  projects: ReadonlyArray<ProjectPortalProject> | undefined,
  projectId: string,
) {
  return projects?.find((project) => project.id === projectId);
}
